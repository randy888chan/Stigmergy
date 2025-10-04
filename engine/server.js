import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { upgradeWebSocket } from 'hono/bun';
import { cors } from 'hono/cors';
import chalk from 'chalk';
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';
import { streamText } from 'ai';
import config from '../stigmergy.config.js';
import { getAiProviders } from '../ai/providers.js';

// This is the definitive mock AI logic that correctly simulates the agent swarm workflow.
const mockStreamTextForRefactor = async ({ messages }) => {
    const lastMessage = messages[messages.length - 1];

    const getAgentFromSystemPrompt = (msgs) => {
        const systemMessage = msgs.find(m => m.role === 'system');
        if (!systemMessage || !systemMessage.content) return null;
        if (systemMessage.content.includes('I am the Specifier')) return '@specifier';
        if (systemMessage.content.includes('I am Quinn')) return '@qa';
        if (systemMessage.content.includes('I am Saul')) return '@dispatcher';
        return null;
    };

    const currentAgent = getAgentFromSystemPrompt(messages);

    switch (currentAgent) {
        case '@specifier':
            // Specifier's only job is to delegate to QA. After that, it's done.
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'stigmergy.task') {
                return { text: 'Specifier task delegated. Stopping.', finishReason: 'stop' };
            }
            return {
                toolCalls: [{ toolCallId: 'spec-to-qa', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review the plan.' } }],
                finishReason: 'tool-calls'
            };

        case '@qa':
            // QA's only job is to delegate to the Dispatcher. After that, it's done.
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'stigmergy.task') {
                return { text: 'QA task delegated. Stopping.', finishReason: 'stop' };
            }
            return {
                toolCalls: [{ toolCallId: 'qa-to-dispatcher', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'Plan approved. Execute.' } }],
                finishReason: 'tool-calls'
            };

        case '@dispatcher':
            // Dispatcher has a two-step job.
            const hasWrittenFile = messages.some(m => m.role === 'tool' && m.tool_name === 'file_system.writeFile');

            if (!hasWrittenFile) {
                // Step 1: Write the file. The loop will continue for the next step.
                return {
                    toolCalls: [{ toolCallId: 'dispatch-write', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }],
                    finishReason: 'tool-calls'
                };
            } else {
                // Step 2: Update the status. After this, the dispatcher is done.
                 if (lastMessage.role === 'tool' && lastMessage.tool_name === 'system.updateStatus') {
                    return { text: 'Dispatcher finished. Stopping.', finishReason: 'stop' };
                }
                return {
                    toolCalls: [{ toolCallId: 'dispatch-complete', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }],
                    finishReason: 'tool-calls'
                };
            }

        default:
            return { text: 'Unknown agent or final step. Stopping.', finishReason: 'stop' };
    }
};


export class Engine {
    constructor(options = {}) {
        if (!options.stateManager) {
            throw new Error("Engine requires a stateManager instance on construction.");
        }
        this.app = new Hono();
        this.app.use('*', cors());
        this.projectRoot = options.projectRoot || process.cwd();
        this.stateManager = options.stateManager;
        this.clients = new Set();
        this.server = null;
        this._test_streamText = options._test_streamText; // For dependency injection in tests
        this._test_createExecutor = options._test_createExecutor; // For dependency injection in tests

        // Conditionally initialize AI providers only if not in mock mode
        if (options._test_streamText) {
            this.ai = null; // In mock mode, no real AI providers are needed.
            console.log(chalk.yellow('[Engine] Mock AI is active. Skipping real AI provider initialization.'));
        } else {
            const aiProviders = getAiProviders(config);
            this.ai = aiProviders;
        }
        // DEPRECATED: executeTool is now created on-the-fly in triggerAgent
        // this.executeTool = createExecutor(this, this.ai);

        this.setupRoutes();
        this.setupStateListener();
    }

    async executeGoal(prompt) {
        console.log(chalk.cyan(`[Engine] Received new goal: "${prompt}"`));
        await this.stateManager.initializeProject(prompt);
    }
    
    setupStateListener() {
        this.stateManager.on('stateChanged', async (newState) => {
            try {
                console.log(chalk.magenta(`[Engine] State changed to: ${newState.project_status}`));
                this.broadcastEvent('state_update', newState);

                if (newState.project_status === 'ENRICHMENT_PHASE') {
                    await this.initiateAutonomousSwarm(newState);
                }
            } catch (error) {
                console.error(chalk.red('[Engine] CRITICAL ERROR in stateChanged handler:'), error);
                await this.stateManager.updateStatus({ newStatus: 'ERROR', message: `Critical error in state handler: ${error.message}` });
            }
        });

        this.stateManager.on('triggerAgent', async ({ agentId, prompt }) => {
            console.log(chalk.green(`[Engine] Received triggerAgent event for ${agentId}`));
            await this.triggerAgent(agentId, prompt);
        });
    }

    async initiateAutonomousSwarm(state) {
        console.log(chalk.cyan('[Engine] Autonomous swarm initiated.'));
        // The CORRECT first step is to trigger the PLANNER, not the dispatcher.
        const extractFilePaths = (text) => {
            const filePathRegex = /([\w\/-]+\.[\w]+)/g;
            const matches = text.match(filePathRegex);
            return matches || [];
        };
        const filePaths = extractFilePaths(state.goal);
        const initialPrompt = `A new project goal has been set. Please create the initial \`plan.md\` file to achieve it. The goal is: "${state.goal}". The relevant file is: ${filePaths.join(', ')}`;
        await this.triggerAgent('@specifier', initialPrompt);
    }

    async triggerAgent(agentId, prompt) {
        console.log(chalk.yellow(`[Engine] Triggering agent ${agentId} with prompt: "${prompt}"`));
        const agentName = agentId.replace('@', '');

        try {
            console.log(chalk.red.bold(`[DEBUG] Is _test_streamText defined? ${!!this._test_streamText}`));
            // 1. Create a dedicated working directory (sandbox) for the agent
            const workingDirectory = path.join(this.projectRoot, '.stigmergy-core', 'sandboxes', agentName);
            await fs.ensureDir(workingDirectory);
            console.log(chalk.blue(`[Engine] Ensured agent sandbox exists at: ${workingDirectory}`));

            // 2. Create a tool executor instance specific to this agent's context
            const executorFactory = this._test_createExecutor || createExecutor;
            const executeTool = executorFactory(this, this.ai, { workingDirectory, config });

            const agentPath = path.join(this.projectRoot, '.stigmergy-core', 'agents', `${agentName}.md`);
            const agentFileContent = await fs.readFile(agentPath, 'utf-8');
            const yamlMatch = agentFileContent.match(/```yaml\n([\s\S]*?)\n```/);

            let systemPrompt = 'You are a helpful AI assistant.'; // Default prompt

            if (yamlMatch && yamlMatch[1]) {
                const agentDefinition = yaml.load(yamlMatch[1]);
                const agentConfig = agentDefinition.agent || {};

                const persona = agentConfig.persona || {};
                const protocols = agentConfig.core_protocols || [];

                const personaText = [persona.role, persona.style, persona.identity].filter(Boolean).join(' ');

                let finalPrompt = personaText;

                if (protocols.length > 0) {
                    const protocolText = `My core protocols are:\n- ${protocols.join('\n- ')}`;
                    if (finalPrompt) {
                        finalPrompt += `\n\n${protocolText}`;
                    } else {
                        finalPrompt = protocolText;
                    }
                }

                if (finalPrompt) {
                    systemPrompt = finalPrompt;
                }
            }

            const messages = [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: prompt }
            ];

            let isDone = false;
            const maxTurns = 10;
            let turnCount = 0;

            while (!isDone && turnCount < maxTurns) {
                turnCount++;
                console.log(chalk.blue(`[Engine] Agent loop turn ${turnCount}...`));

                const streamTextFunc = this._test_streamText || streamText;
                let model;
                if (this._test_streamText) {
                    model = null;
                } else {
                    const { client, modelName } = this.ai.getModelForTier('reasoning_tier');
                    model = client(modelName);
                }

                const { toolCalls, finishReason, text } = await streamTextFunc({
                    model,
                    messages,
                    tools: executeTool.getTools(),
                });

                if (finishReason === 'stop' || finishReason === 'length') {
                    console.log(chalk.yellow(`[Engine] Agent loop finished with reason: ${finishReason}`));
                    isDone = true;
                    continue;
                }

                if (toolCalls && toolCalls.length > 0) {
                    messages.push({ role: 'assistant', content: text || '', tool_calls: toolCalls });

                    const toolResults = [];
                    for (const toolCall of toolCalls) {
                        console.log(chalk.cyan(`[Agent] Calling tool: ${toolCall.toolName} with args: ${JSON.stringify(toolCall.args, null, 2)}`));
                        const result = await executeTool.execute(toolCall.toolName, toolCall.args, agentName);
                        
                        if (result && result.project_status) {
                            this.broadcastEvent('state_update', result);
                        }
                        
                        toolResults.push({
                            role: 'tool',
                            tool_call_id: toolCall.toolCallId,
                            tool_name: toolCall.toolName,
                            content: JSON.stringify(result),
                        });

                    }
                    messages.push(...toolResults);
                }
            }

            if (turnCount >= maxTurns) {
                console.error(chalk.red('[Engine] Agent loop reached max turns. Aborting.'));
            }

        } catch (error) {
            console.error(chalk.red('[Engine] Error in agent logic:'), error);
            await this.stateManager.updateStatus({ newStatus: 'ERROR', message: 'Agent failed to execute.' });
        }
    }

    setupRoutes() {
        this.app.get(
            '/ws',
            upgradeWebSocket((c) => {
                return {
                    onOpen: (evt, ws) => {
                        console.log(chalk.blue('[WebSocket] Client connected'));
                        this.clients.add(ws);
                    },
                    onMessage: async (evt, ws) => {
                        try {
                            const data = JSON.parse(evt.data);
                            if (data.type === 'user_chat_message') {
                                await this.executeGoal(data.payload.prompt);
                            }
                        } catch (error) {
                            console.error(chalk.red('[WebSocket] Error processing message:'), error);
                        }
                    },
                    onClose: (evt, ws) => {
                        console.log(chalk.blue('[WebSocket] Client disconnected'));
                        this.clients.delete(ws);
                    },
                    onError: (err) => {
                        console.error(chalk.red('[WebSocket] Error:'), err);
                    },
                };
            })
        );

        this.app.get('/', (c) => c.text('Stigmergy Engine is running!'));
    }

    broadcastEvent(type, payload) {
        const message = JSON.stringify({ type, payload });
        for (const client of this.clients) {
            if (client.readyState === 1) { // WebSocket.OPEN
                client.send(message);
            }
        }
    }

    async start() {
        console.log(chalk.blue("Initializing Stigmergy Engine..."));
        const PORT = Number(process.env.STIGMERGY_PORT) || 3010;
        
        return new Promise((resolve) => {
            if (typeof Bun !== 'undefined') {
                console.log(chalk.cyan("[Engine] Detected Bun environment. Using Bun.serve."));
                this.server = Bun.serve({
                    port: PORT,
                    fetch: (req, server) => this.app.fetch(req, { server }),
                    websocket: {
                        open: (ws) => {
                            const { events } = ws.data;
                            events?.onOpen?.(createWebSocketEvent(ws), ws);
                        },
                        message: (ws, message) => {
                            const { events } = ws.data;
                            events?.onMessage?.(createWebSocketEvent(ws, message), ws);
                        },
                        close: (ws, code, reason) => {
                            const { events } = ws.data;
                            events?.onClose?.(createWebSocketEvent(ws, code, reason), ws);
                        },
                        drain: (ws) => {
                            const { events } = ws.data;
                            events?.onDrain?.(createWebSocketEvent(ws), ws);
                        },
                    },
                });
                console.log(chalk.green(`🚀 Stigmergy Engine (Bun/Hono) server is running on http://localhost:${PORT}`));
                resolve();
            } else {
                console.log(chalk.cyan("[Engine] Detected Node.js environment. Using @hono/node-server."));
                this.server = serve({
                    fetch: this.app.fetch,
                    port: PORT,
                }, (info) => {
                    console.log(chalk.green(`🚀 Stigmergy Engine (Node/Hono) server is running on http://localhost:${info.port}`));
                    resolve();
                });
            }
        });
    }

    async stop() {
        if (!this.server) {
            return;
        }

        console.log(chalk.yellow('[Engine] Attempting to stop server...'));

        // Close all active WebSocket connections
        console.log(chalk.yellow(`[Engine] Closing ${this.clients.size} WebSocket clients...`));
        for (const client of this.clients) {
            client.close(1000, 'Server is shutting down');
        }
        this.clients.clear();

        if (typeof Bun !== 'undefined' && this.server.stop) {
            // Bun environment
            await this.server.stop(true); // Force close
            console.log(chalk.yellow('[Engine] Server stopped (Bun).'));
        } else if (this.server.close) {
            // Node.js environment
            await new Promise((resolve, reject) => {
                this.server.close((err) => {
                    if (err) {
                        console.error(chalk.red('[Engine] Error stopping server (Node):'), err);
                        return reject(err);
                    }
                    console.log(chalk.yellow('[Engine] Server stopped (Node).'));
                    resolve();
                });
            });
        } else {
            console.warn(chalk.yellow('[Engine] Server object found, but no stop() or close() method available.'));
        }
    }
}

function createWebSocketEvent(ws, data, code, reason) {
    if (data) {
        return new MessageEvent('message', { data });
    }
    if (code !== undefined) {
        return new CloseEvent('close', { code, reason });
    }
    return new Event('open');
}

// This block ensures the server can run directly for production
if (import.meta.main) {
    const stateManager = new GraphStateManager();

    const engineOptions = { stateManager };

    // If the USE_MOCK_AI flag is set, inject the mock AI function.
    if (process.env.USE_MOCK_AI === 'true') {
        console.log(chalk.yellow('--- [NOTICE] ---'));
        console.log(chalk.yellow('Running with USE_MOCK_AI=true. All AI calls will be mocked.'));
        console.log(chalk.yellow('This is for local testing of the `send_prompt.js` script without API keys.'));
        console.log(chalk.yellow('--- [NOTICE] ---'));
        engineOptions._test_streamText = mockStreamTextForRefactor;
    }

    const engine = new Engine(engineOptions);
    engine.start();
}