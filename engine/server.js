import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { upgradeWebSocket } from 'hono/bun';
import { cors } from 'hono/cors';
import chalk from 'chalk';
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import { getAiProviders } from '../ai/providers.js';
import config from '../stigmergy.config.js';
import { streamText } from 'ai';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';

export class Engine {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.stateManager = options.stateManager || new GraphStateManager(this.projectRoot);

        this.app = new Hono();
        this.app.use('*', cors());

        // Middleware to make stateManager available to all routes
        this.app.use('*', (c, next) => {
            c.set('stateManager', this.stateManager);
            return next();
        });

        this.clients = new Set();
        this.server = null;
        this._test_streamText = options._test_streamText;
        this._test_createExecutor = options._test_createExecutor;

        if (!this._test_streamText) {
            this.ai = getAiProviders(config);
        }

        // Setup routes and listeners
        this.setupRoutes();
        this.setupStateListener();
    }

    async setActiveProject(projectPath) {
        console.log(chalk.blue(`[Engine] Setting active project to: ${projectPath}`));
        if (!projectPath || typeof projectPath !== 'string') {
            console.error(chalk.red('[Engine] Invalid project path provided.'));
            return;
        }

        this.projectRoot = projectPath;

        // Re-initialize the GraphStateManager with the new project root
        if (this.stateManager) {
             this.stateManager.off('stateChanged');
             this.stateManager.off('triggerAgent');
        }
        this.stateManager = new GraphStateManager(this.projectRoot);
        this.setupStateListener();

        console.log(chalk.green(`[Engine] Project context switched. New root: ${this.projectRoot}`));
        this.broadcastEvent('project_switched', { path: this.projectRoot });
    }

    async executeGoal(prompt) {
        console.log(chalk.cyan(`[Engine] Received new goal for project ${this.projectRoot}: "${prompt}"`));
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
            const workingDirectory = path.join(this.projectRoot, '.stigmergy-core', 'sandboxes', agentName);
            await fs.ensureDir(workingDirectory);
            console.log(chalk.blue(`[Engine] Ensured agent sandbox exists at: ${workingDirectory}`));

            const executorFactory = this._test_createExecutor || createExecutor;
            const executeTool = executorFactory(this, this.ai, { workingDirectory, config });

            const agentPath = path.join(this.projectRoot, '.stigmergy-core', 'agents', `${agentName}.md`);
            const agentFileContent = await fs.readFile(agentPath, 'utf-8');
            const yamlMatch = agentFileContent.match(/```yaml\n([\s\S]*?)\n```/);

            let systemPrompt = 'You are a helpful AI assistant.';

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
        // --- THIS IS THE CRITICAL FIX: DEFINE SPECIFIC ROUTES FIRST ---

        // 1. Health Check Endpoint
        this.app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

        // 2. Dashboard API Endpoint
        this.app.get('/api/state', async (c) => {
            const stateManager = c.get('stateManager');
            if (stateManager) {
                const state = await stateManager.getState();
                return c.json(state);
            }
            return c.json({ error: 'StateManager not available' }, 500);
        });

        // 3. IDE (MCP) Endpoint
        this.app.post('/mcp', async (c) => {
            const { prompt, project_path } = await c.req.json();

            if (!prompt || !project_path) {
                return c.json({ error: 'Prompt and project_path are required.' }, 400);
            }

            console.log(chalk.cyan(`[MCP] Received prompt for project: ${project_path}`));
            await this.setActiveProject(project_path);

            // This endpoint now uses streamSSE for OpenAI compatibility
            return c.streamSSE(async (stream) => {
                const formatAsOpenAIStream = (content, finishReason = null) => {
                    const chunk = {
                        id: `chatcmpl-${Date.now()}`,
                        object: 'chat.completion.chunk',
                        created: Math.floor(Date.now() / 1000),
                        model: 'stigmergy-mcp',
                        choices: [
                            {
                                index: 0,
                                delta: { content },
                                finish_reason: finishReason,
                            },
                        ],
                    };
                    return JSON.stringify(chunk);
                };

                const listener = async (event) => {
                    const content = `\`\`\`json\n${JSON.stringify(event, null, 2)}\n\`\`\``;
                    await stream.writeSSE({ data: formatAsOpenAIStream(content) });
                };

                this.stateManager.on('stateChanged', listener);

                stream.onAbort(() => {
                    console.log(chalk.yellow('[MCP] Stream aborted by client.'));
                    this.stateManager.off('stateChanged', listener);
                });

                try {
                    const initialMessage = 'Processing new goal...';
                    await stream.writeSSE({ data: formatAsOpenAIStream(initialMessage) });

                    await this.executeGoal(prompt);
                    // The stateChanged listener will now handle subsequent updates.
                    // We need to keep the connection alive until a terminal state is reached.

                    // Add a timeout to prevent hanging indefinitely
                    const timeout = setTimeout(async () => {
                        console.warn(chalk.yellow('[MCP] Stream timed out. Sending final message.'));
                        this.stateManager.off('stateChanged', listener);
                        await stream.writeSSE({ data: formatAsOpenAIStream(null, 'stop') });
                        await stream.writeSSE({ data: '[DONE]' });
                        stream.close();
                    }, 120000); // 2 minutes timeout

                    // Listen for a terminal state to close the stream cleanly
                    const terminalStates = ['COMPLETED', 'ERROR', 'PLAN_EXECUTED'];
                    const finalStateListener = async (state) => {
                        if (terminalStates.includes(state.project_status)) {
                            console.log(chalk.green(`[MCP] Reached terminal state: ${state.project_status}. Closing stream.`));
                            clearTimeout(timeout);
                            this.stateManager.off('stateChanged', listener);
                            this.stateManager.off('stateChanged', finalStateListener); // Clean up self
                            await stream.writeSSE({ data: formatAsOpenAIStream(null, 'stop') });
                            await stream.writeSSE({ data: '[DONE]' });
                            stream.close();
                        }
                    };
                    this.stateManager.on('stateChanged', finalStateListener);


                } catch (error) {
                    console.error(chalk.red('[MCP] Error executing goal:'), error);
                    const errorMessage = `Error: ${error.message}`;
                    await stream.writeSSE({ data: formatAsOpenAIStream(errorMessage, 'stop') });
                    await stream.writeSSE({ data: '[DONE]' });
                    stream.close();
                }
            });
        });

        // 4. WebSocket Endpoint
        this.app.get('/ws', upgradeWebSocket((c) => {
            return {
                onOpen: (evt, ws) => {
                    console.log(chalk.blue('[WebSocket] Client connected'));
                    this.clients.add(ws);
                },
                onMessage: async (evt, ws) => {
                    try {
                        const data = JSON.parse(evt.data);
                        if (data.type === 'start_mission') {
                            const { goal, project_path } = data.payload;
                            console.log(chalk.blue(`[WebSocket] Received start_mission for project: ${project_path}`));
                            await this.setActiveProject(project_path);
                            await this.executeGoal(goal);
                        } else if (data.type === 'user_chat_message') {
                            await this.executeGoal(data.payload.prompt);
                        } else if (data.type === 'set_project') {
                            await this.setActiveProject(data.payload.path);
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
        }));

        // --- THIS MUST BE LAST: THE GENERAL "CATCH-ALL" ROUTES ---

        // 5. Serve Static Assets (JS, CSS, images) from the public directory
        const publicPath = path.join(this.projectRoot, 'dashboard', 'public');
        this.app.use('/*', serveStatic({ root: publicPath }));

        // 6. Fallback for Single-Page App: Serve index.html for any other GET request.
        // This makes React Router work.
        this.app.get('*', serveStatic({ path: './index.html', root: publicPath }));
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

        console.log(chalk.yellow(`[Engine] Closing ${this.clients.size} WebSocket clients...`));
        for (const client of this.clients) {
            client.close(1000, 'Server is shutting down');
        }
        this.clients.clear();

        if (typeof Bun !== 'undefined' && this.server.stop) {
            await this.server.stop(true);
            console.log(chalk.yellow('[Engine] Server stopped (Bun).'));
        } else if (this.server.close) {
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

if (import.meta.main) {
    const stateManager = new GraphStateManager();
    const engineOptions = { stateManager };

    if (process.env.USE_MOCK_AI === 'true') {
        console.log(chalk.yellow('--- [NOTICE] ---'));
        console.log(chalk.yellow('Running with USE_MOCK_AI=true. AI provider initialization will be skipped.'));
        console.log(chalk.yellow('This is for local testing and requires a mock function to be injected during tests.'));
        console.log(chalk.yellow('--- [NOTICE] ---'));
        engineOptions._test_streamText = true;
    }

    const engine = new Engine(engineOptions);
    engine.start();
}