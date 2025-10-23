import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { upgradeWebSocket } from 'hono/bun';
import { cors } from 'hono/cors';
import chalk from 'chalk';
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { FileStorageAdapter } from '../src/infrastructure/state/FileStorageAdapter.js';
import { HttpStorageAdapter } from '../src/infrastructure/state/HttpStorageAdapter.js';
import { createExecutor } from "./tool_executor.js";
import * as fileSystem from '../tools/file_system.js';
import * as coderag from '../tools/coderag_tool.js';
import { getAiProviders } from '../ai/providers.js';
import { configService } from '../services/config_service.js';
import { streamText } from 'ai';
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';
import tmp from 'tmp';
import { unifiedIntelligenceService } from '../services/unified_intelligence.js';

export class Engine {
    constructor(options = {}) {
        this.projectRoot = options.projectRoot || process.cwd();
        this.corePath = options.corePath || path.join(this.projectRoot, '.stigmergy-core');
        this.config = configService.getConfig();

        // State Manager will be initialized asynchronously
        this.stateManager = null;

        // Bind listeners to `this` FIRST to avoid race conditions.
        this.stateChangedListener = this._onStateChanged.bind(this);
        this.triggerAgentListener = this._onTriggerAgent.bind(this);

        this.stateManagerInitializationPromise = this._initializeStateManager(options);

        this._test_unifiedIntelligenceService = options._test_unifiedIntelligenceService;
        this._test_executorFactory = options._test_executorFactory;
        this.unifiedIntelligenceService = this._test_unifiedIntelligenceService || options.unifiedIntelligenceService || unifiedIntelligenceService;

        this.shouldStartServer = options.startServer !== false; // Defaults to true

        this.app = new Hono();
        this.app.use('*', cors());

        // Middleware to make stateManager available to all routes
        this.app.use('*', (c, next) => {
            c.set('stateManager', this); // Pass the whole engine instance
            return next();
        });

        this.clients = new Set();
        this.pendingApprovals = new Map(); // For Human Handoff
        this.server = null;
        this._test_streamText = options._test_streamText || (() => Promise.resolve({ toolCalls: [], finishReason: 'stop', text: '' }));
        this._test_onEnrichment = options._test_onEnrichment;
        this._test_fs = options._test_fs; // For injecting memfs in tests

        if (options.broadcastEvent) {
            this.broadcastEvent = options.broadcastEvent;
        }

        this.config = configService.getConfig();

        if (!this._test_streamText) {
            this.ai = getAiProviders(this.config);
        }

        // Setup routes and listeners
        this.setupRoutes();
        // this.setupStateListener(); // This will be called after state manager is initialized

        // Initialize tool executor
        this.toolExecutorPromise = this.initializeToolExecutor();

        // Add this block:
        this.healthCheckInterval = setInterval(async () => {
            if (this.clients.size > 0) {
                const { get_system_health_overview } = await import('../tools/swarm_intelligence_tools.js');
                const healthData = await get_system_health_overview();
                this.broadcastEvent('system_health_update', healthData);
            }
        }, 30000); // Broadcast every 30 seconds
    }

    async _initializeStateManager(options) {
        // --- Definitive Fix: Dependency Injection for State Manager ---
        this.isExternalStateManager = !!options.stateManager;
        if (options.stateManager) {
            this.stateManager = options.stateManager;
        } else {
            let collaborationMode = this.config.collaboration?.mode || 'single-player';
            const serverUrl = this.config.collaboration?.server_url;
            console.log(chalk.blue(`[Engine] Attempting to initialize in ${collaborationMode} mode.`));

            let storageAdapter;

            if (collaborationMode === 'team') {
                try {
                    const healthCheckUrl = new URL('/health', serverUrl).toString();
                    console.log(chalk.blue(`[Engine] Pinging team server at ${healthCheckUrl}...`));
                    const response = await fetch(healthCheckUrl, { timeout: 3000 });
                    if (!response.ok) {
                        throw new Error(`Health check failed with status: ${response.status}`);
                    }
                    console.log(chalk.green('[Engine] Team server is healthy. Connecting...'));
                    storageAdapter = new HttpStorageAdapter(serverUrl);
                } catch (error) {
                    console.warn(chalk.yellow(`[Engine] WARN: Team server health check failed: ${error.message}`));
                    console.warn(chalk.yellow('[Engine] Falling back to "single-player" mode.'));
                    collaborationMode = 'single-player';
                    storageAdapter = new FileStorageAdapter();
                }
            } else {
                storageAdapter = new FileStorageAdapter();
            }

            this.stateManager = new GraphStateManager(this.projectRoot, storageAdapter);
        }
        // --- End of Fix ---
        this.setupStateListener();
    }


    async initializeToolExecutor() {
        const executorFactory = this._test_executorFactory || createExecutor;
        const fsProvider = this._test_fs || fs;
        this.toolExecutor = await executorFactory(this, this.ai, { config: this.config, unifiedIntelligenceService: this.unifiedIntelligenceService }, fsProvider);
    }

    async setActiveProject(projectPath) {
        await this.stateManagerInitializationPromise;
        console.log(chalk.blue(`[Engine] Setting active project to: ${projectPath}`));
        if (!projectPath || typeof projectPath !== 'string') {
            console.error(chalk.red('[Engine] Invalid project path provided.'));
            return;
        }

        this.projectRoot = projectPath;

        // Re-initialize the GraphStateManager with the new project root
        if (this.stateManager) {
             this.stateManager.off('stateChanged', this.stateChangedListener);
             this.stateManager.off('triggerAgent', this.triggerAgentListener);
        }
        // Re-run the initialization for the new path
        this.stateManagerInitializationPromise = this._initializeStateManager({});
        await this.stateManagerInitializationPromise;


        console.log(chalk.green(`[Engine] Project context switched. New root: ${this.projectRoot}`));
        this.broadcastEvent('project_switched', { path: this.projectRoot });
    }

    async executeGoal(prompt) {
        await this.stateManagerInitializationPromise;
        console.log(chalk.cyan(`[Engine] Received new goal for project ${this.projectRoot}: "${prompt}"`));
        await this.stateManager.initializeProject(prompt);
    }
    
    setupStateListener() {
        if (!this.stateManager) {
            console.error(chalk.red('[Engine] CRITICAL: setupStateListener called before state manager was initialized.'));
            return;
        }
        // Now use the bound listeners
        this.stateManager.on('stateChanged', this.stateChangedListener);
        this.stateManager.on('triggerAgent', this.triggerAgentListener);
    }

    // New private method for handling state changes
    async _onStateChanged(newState) {
        await this.stateManagerInitializationPromise;
        try {
            console.log(chalk.magenta(`[Engine] State changed to: ${newState.project_status}`));
            this.broadcastEvent('state_update', newState);

            if (newState.project_status === 'ENRICHMENT_PHASE') {
                if (this._test_onEnrichment) {
                    await this._test_onEnrichment(newState);
                } else {
                    await this.initiateAutonomousSwarm(newState);
                }
            }
        } catch (error) {
            console.error(chalk.red('[Engine] CRITICAL ERROR in stateChanged handler:'), error);
            await this.stateManager.updateStatus({ newStatus: 'ERROR', message: `Critical error in state handler: ${error.message}` });
        }
    }

    // New private method for handling agent triggers
    async _onTriggerAgent({ agentId, prompt }) {
        await this.stateManagerInitializationPromise;
        console.log(chalk.green(`[Engine] Received triggerAgent event for ${agentId}`));
        await this.triggerAgent(agentId, prompt);
    }

    async initiateAutonomousSwarm(state) {
        await this.stateManagerInitializationPromise;
        console.log(chalk.cyan('[Engine] Intelligence Gathering Phase Initiated.'));

        try {
            // 1. External Research: Trigger the @analyst agent
            console.log(chalk.blue('[Engine] Triggering @analyst for external research.'));
            await this.stateManager.updateStatus({ message: 'Phase 1: Conducting external research...' });
            const analystPrompt = `A new project goal has been set: "${state.goal}". Your task is to conduct a thorough analysis and return a research report as your final response.`;
            const analystReport = await this.triggerAgent('@analyst', analystPrompt);
            console.log(chalk.green('[Engine] @analyst has completed its research.'));
            await this.stateManager.updateStatus({ message: 'External research complete.' });


            // 2. Local Indexing: Trigger the CodeRAG indexing process
            console.log(chalk.blue('[Engine] Triggering local codebase indexing via CodeRAG.'));
            await this.stateManager.updateStatus({ message: 'Phase 2: Indexing local codebase...' });
            await coderag.scan_codebase({ project_root: this.projectRoot });
            console.log(chalk.green('[Engine] Local codebase indexing complete.'));
            await this.stateManager.updateStatus({ message: 'Local codebase indexed.' });


            // 3. Enriched Handoff: Trigger the @specifier with the combined intelligence
            console.log(chalk.blue('[Engine] Handing off to @specifier with enriched context.'));
            await this.stateManager.updateStatus({ message: 'Phase 3: Synthesizing plan...' });
            const specifierPrompt = `
# Project Goal
${state.goal}

# External Research Findings
The following report was generated by the @analyst agent:
---
${analystReport || "No report was generated by the analyst."}
---

# Local Codebase Analysis
The local codebase has been indexed and is ready for queries.

# Your Task
Based on all the information above, please create the initial \`plan.md\` file to achieve the project goal.
`;
            await this.triggerAgent('@specifier', specifierPrompt);
            console.log(chalk.green('[Engine] @specifier has been triggered. The swarm is now fully autonomous.'));
            await this.stateManager.updateStatus({ newStatus: 'PLANNING_PHASE', message: 'Handoff to @specifier complete.' });

        } catch (error) {
            console.error(chalk.red('[Engine] CRITICAL ERROR during intelligence gathering:'), error);
            await this.stateManager.updateStatus({ newStatus: 'ERROR', message: `Failed during intelligence gathering: ${error.message}` });
        }
    }

    async triggerAgent(agentId, prompt) {
        await this.toolExecutorPromise; // Wait for the executor to be initialized
        await this.stateManagerInitializationPromise;
        console.log(chalk.yellow(`[Engine] Triggering agent ${agentId} with prompt: "${prompt}"`));
        const agentName = agentId.replace('@', '');
        let lastTextResponse = null;

        try {
            const workingDirectory = path.join(this.projectRoot, '.stigmergy', 'sandboxes', agentName);
            await fs.ensureDir(workingDirectory);
            console.log(chalk.blue(`[Engine] Ensured agent sandbox exists at: ${workingDirectory}`));

            const executeTool = this.toolExecutor;

            const agentPath = path.join(this.corePath, 'agents', `${agentName}.md`);
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

                lastTextResponse = text; // Always capture the last text response

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
                        // Pass the agent's specific working directory to the executor
                        const result = await executeTool.execute(toolCall.toolName, toolCall.args, agentName, workingDirectory);
                        
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
                } else {
                    // If there are no tool calls, but the finish reason isn't stop, we might be done.
                    // This handles cases where the agent just responds with text.
                    isDone = true;
                }
            }

            if (turnCount >= maxTurns) {
                console.error(chalk.red('[Engine] Agent loop reached max turns. Aborting.'));
            }

            return lastTextResponse; // Return the last captured text response

        } catch (error) {
            console.error(chalk.red('[Engine] Error in agent logic:'), error);
            await this.stateManager.updateStatus({ newStatus: 'ERROR', message: 'Agent failed to execute.' });
            return null; // Return null on error
        }
    }

    setupRoutes() {
        // --- THIS IS THE CRITICAL FIX: DEFINE SPECIFIC ROUTES FIRST ---

        // 1. Health Check Endpoint
        this.app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

        // 2. Dashboard API Endpoints
        this.app.get('/api/state', async (c) => {
            const engine = c.get('stateManager'); // Now the engine instance
            await engine.stateManagerInitializationPromise; // Ensure state manager is ready
            if (engine && engine.stateManager) {
                const state = await engine.stateManager.getState();
                return c.json(state);
            }
            return c.json({ error: 'StateManager not available' }, 500);
        });

        this.app.get('/api/files', async (c) => {
            // The listDirectory tool now expects an absolute path.
            const files = await fileSystem.listDirectory({ path: this.projectRoot });
            return c.json(files);
        });

        this.app.get('/api/file-content', async (c) => {
            const { path: filePath } = c.req.query();
            if (!filePath) {
                return c.json({ error: 'File path is required.' }, 400);
            }
            try {
                if (filePath.includes('..')) {
                    return c.json({ error: 'Invalid file path.' }, 400);
                }
                const content = await fileSystem.readFile({ path: filePath, projectRoot: this.projectRoot });
                return c.json({ content });
            } catch (error) {
                return c.json({ error: `Failed to read file: ${error.message}` }, 500);
            }
        });

        this.app.get('/api/projects', async (c) => {
            const { basePath } = c.req.query();

            if (!basePath) {
                return c.json({ error: 'basePath query parameter is required.' }, 400);
            }

            // Security: Basic path validation
            if (basePath.includes('..') || !path.isAbsolute(basePath)) {
                return c.json({ error: 'Invalid basePath provided.' }, 400);
            }

            try {
                const dirents = await fs.readdir(basePath, { withFileTypes: true });
                const directories = dirents
                    .filter(dirent => dirent.isDirectory())
                    .map(dirent => dirent.name);
                return c.json(directories);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return c.json({ error: `Base path not found: ${basePath}` }, 404);
                }
                console.error(`[Engine] Error reading projects from ${basePath}:`, error);
                return c.json({ error: 'Failed to list projects.' }, 500);
            }
        });

        this.app.get('/api/mission-plan', async (c) => {
            const planPath = path.join(this.projectRoot, 'plan.md');
            try {
                const fileContent = await fs.readFile(planPath, 'utf-8');
                const yamlMatch = fileContent.match(/```(?:yaml|yml)\n([\s\S]*?)\n```/);
                if (!yamlMatch || !yamlMatch[1]) {
                    return c.json({ tasks: [], message: 'Could not parse YAML from plan.md.' }, 500);
                }
                const planData = yaml.load(yamlMatch[1]);
                return c.json(planData);
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return c.json({ tasks: [], message: 'Plan not yet created.' });
                }
                return c.json({ error: `Failed to read or parse mission plan: ${error.message}` }, 500);
            }
        });

        // API for CodeRAG Search
        this.app.get('/api/coderag/search', async (c) => {
            const { query } = c.req.query();
            if (!query) return c.json({ error: 'Query is required' }, 400);
            try {
                const results = await coderag.semantic_search({ query, project_root: this.projectRoot });
                return c.json(results);
            } catch (error) {
                return c.json({ error: error.message }, 500);
            }
        });

        // API for getting node details (as a placeholder for future expansion)
        this.app.get('/api/coderag/node/:id', async (c) => {
            const { id } = c.req.param();
            // Placeholder: In a real implementation, you'd fetch node details here.
            return c.json({ id, details: `Details for node ${id} would be here.` });
        });

        this.app.get('/api/proposals', async (c) => {
            const proposalsDir = path.join(this.corePath, 'proposals');
            try {
                const proposalFiles = await fs.readdir(proposalsDir);
                const jsonFiles = proposalFiles.filter(f => f.endsWith('.json'));

                const proposals = await Promise.all(
                    jsonFiles.map(async (file) => {
                        const filePath = path.join(proposalsDir, file);
                        const content = await fs.readJson(filePath);
                        return content;
                    })
                );

                return c.json(proposals.filter(p => p.status === 'pending').sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
            } catch (error) {
                if (error.code === 'ENOENT') {
                    // If the directory doesn't exist, it means no proposals have been made yet.
                    return c.json([]);
                }
                console.error('[Engine] Error reading proposals:', error);
                return c.json({ error: 'Failed to retrieve proposals.' }, 500);
            }
        });

        this.app.post('/api/proposals/:id/approve', async (c) => {
            const { id } = c.req.param();
            const proposalsDir = path.join(this.corePath, 'proposals');
            const proposalPath = path.join(proposalsDir, `${id}.json`);

            try {
                const proposal = await fs.readJson(proposalPath);

                if (proposal.status !== 'pending') {
                    return c.json({ error: `Proposal ${id} is not pending.` }, 409);
                }

                // This is where we trigger the @guardian to apply the change.
                // The prompt is very specific and gives the guardian all context.
                const guardianPrompt = `
A human operator has APPROVED the following system improvement proposal.
You MUST now apply it.

**Proposal ID:** ${proposal.id}
**Reason for Change:** ${proposal.reason}

**Action:**
You are cleared to apply the change. Use the \`file_system.writeFile\` tool to apply the new content to the specified file.

**PROPOSED CHANGE DETAILS:**
---
**FILE_PATH:** ${proposal.file_path}
---
**NEW_CONTENT:**
\`\`\`
${proposal.new_content}
\`\`\`
---
Execute the file write operation now. Upon success, respond with a confirmation message.
                `;

                // Fire-and-forget the agent trigger
                this.triggerAgent('@guardian', guardianPrompt).catch(err => {
                    console.error(chalk.red(`[Engine] Background @guardian trigger failed for proposal ${id}:`), err);
                });

                // Immediately update the proposal status and respond to the user.
                proposal.status = 'approved';
                await fs.writeJson(proposalPath, proposal, { spaces: 2 });

                this.broadcastEvent('proposal_updated', proposal);

                return c.json({ message: `Proposal ${id} approved and sent to @guardian for execution.` });

            } catch (error) {
                if (error.code === 'ENOENT') {
                    return c.json({ error: `Proposal ${id} not found.` }, 404);
                }
                console.error(`[Engine] Error approving proposal ${id}:`, error);
                return c.json({ error: 'Failed to approve proposal.' }, 500);
            }
        });

        this.app.post('/api/proposals/:id/reject', async (c) => {
            const { id } = c.req.param();
            const proposalsDir = path.join(this.corePath, 'proposals');
            const proposalPath = path.join(proposalsDir, `${id}.json`);

            try {
                const proposal = await fs.readJson(proposalPath);

                if (proposal.status !== 'pending') {
                    return c.json({ error: `Proposal ${id} is not pending.` }, 409);
                }

                proposal.status = 'rejected';
                await fs.writeJson(proposalPath, proposal, { spaces: 2 });

                this.broadcastEvent('proposal_updated', proposal);
                return c.json({ message: `Proposal ${id} rejected.` });
            } catch (error) {
                if (error.code === 'ENOENT') {
                    return c.json({ error: `Proposal ${id} not found.` }, 404);
                }
                console.error(`[Engine] Error rejecting proposal ${id}:`, error);
                return c.json({ error: 'Failed to reject proposal.' }, 500);
            }
        });

        this.app.post('/api/upload', async (c) => {
            try {
                const formData = await c.req.formData();
                const file = formData.get('file');

                if (!file) {
                    return c.json({ error: 'No file uploaded.' }, 400);
                }

                // Create a temporary file to store the upload
                const tempFile = tmp.fileSync({ postfix: path.extname(file.name) });
                const fileBuffer = await file.arrayBuffer();

                await fs.writeFile(tempFile.name, Buffer.from(fileBuffer));
                console.log(chalk.green(`[Engine] File uploaded and saved temporarily to ${tempFile.name}`));

                // Trigger the analyst agent in the background (fire and forget)
                const analystPrompt = `A new document has been uploaded at \`${tempFile.name}\`. Your task is to process it using the \`document_intelligence.processDocument\` tool and report your findings.`;
                this.triggerAgent('@analyst', analystPrompt).catch(err => {
                    console.error(chalk.red('[Engine] Error triggering agent for document upload:'), err);
                    // Optionally, clean up the temp file on error
                    tempFile.removeCallback();
                });


                return c.json({ message: 'File uploaded and processing started.', filePath: tempFile.name });

            } catch (error) {
                console.error(chalk.red('[Engine] File upload failed:'), error);
                return c.json({ error: 'Failed to process file upload.' }, 500);
            }
        });


        // 3. IDE (MCP) Endpoint
        this.app.get('/mcp', async (c) => {
            const { goal: prompt, project_path } = c.req.query();

            if (!prompt || !project_path) {
                return c.json({ error: 'goal and project_path query parameters are required.' }, 400);
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
                        } else if (data.type === 'human_approval_response') {
                            const { requestId, decision } = data.payload;
                            if (this.pendingApprovals.has(requestId)) {
                                const resolve = this.pendingApprovals.get(requestId);
                                resolve(decision); // Resolve the promise the agent is waiting for
                                this.pendingApprovals.delete(requestId);
                                console.log(chalk.green(`[Engine] Human decision '${decision}' received for request ${requestId}. Resuming agent.`));
                            } else {
                                console.warn(chalk.yellow(`[Engine] Received a human approval response for an unknown or expired request ID: ${requestId}`));
                            }
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
        if (process.env.NODE_ENV !== 'test') {
            // The "Reliable Path" fix: construct path relative to this file's location.
            const currentFilePath = new URL(import.meta.url).pathname;
            const engineDir = path.dirname(currentFilePath);
            const projectRootForStatic = path.resolve(engineDir, '..'); // Assumes engine is one level down from project root
            const publicPath = path.join(projectRootForStatic, 'dashboard', 'public');

            this.app.use('/*', serveStatic({ root: publicPath }));

            // 6. Fallback for Single-Page App: Serve index.html for any other GET request
            this.app.get('*', serveStatic({ path: 'index.html', root: publicPath }));
        }
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
        if (!this.shouldStartServer) {
            console.log(chalk.yellow('[Engine] Server start skipped as per configuration.'));
            return;
        }
        await this.stateManagerInitializationPromise;
        console.log(chalk.blue("Initializing Stigmergy Engine..."));
        const PORT = Number(process.env.STIGMERGY_PORT) || 3010;
        
        return new Promise((resolve) => {
            if (typeof Bun !== 'undefined') {
                console.log(chalk.cyan("[Engine] Detected Bun environment. Using Bun.serve."));
                try {
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
                        error: (error) => {
                            console.error(chalk.red(`[Engine] Bun.serve failed: ${error.message}`));
                            if (error.code === 'EADDRINUSE') {
                                console.error(chalk.red(`[Engine] Port ${PORT} is already in use. Please use a different port.`));
                            }
                            // In a test environment, we might want to reject the promise
                            // For now, we log and exit to prevent a hung process
                            process.exit(1);
                        }
                    });
                    console.log(chalk.green(`🚀 Stigmergy Engine (Bun/Hono) server is running on http://localhost:${PORT}`));
                    resolve();
                } catch (error) {
                    console.error(chalk.red(`[Engine] Critical error during Bun.serve startup: ${error.message}`));
                    process.exit(1);
                }
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
        clearInterval(this.healthCheckInterval);

        // [CRITICAL FIX] Remove listeners to allow graceful shutdown
        if (this.stateManager) {
            this.stateManager.off('stateChanged', this.stateChangedListener);
            this.stateManager.off('triggerAgent', this.triggerAgentListener);

            // --- Definitive Fix: Only close the driver if the Engine created it ---
            if (!this.isExternalStateManager) {
                await this.stateManager.closeDriver();
            }
            // --- End of Fix ---
        }

        if (!this.server) {
            // console.log(chalk.yellow('[Engine] Stop called, but server was not running (expected in tests).'));
            return;
        }

        console.log(chalk.yellow('[Engine] Attempting to stop server...'));

        // Close all active WebSocket connections
        console.log(chalk.yellow(`[Engine] Closing ${this.clients.size} WebSocket clients...`));
        for (const client of this.clients) {
            client.close(1000, 'Server is shutting down');
        }
        this.clients.clear();

        // Use a promise to handle the server closing
        return new Promise((resolve, reject) => {
            if (this.server && this.server.close) {
                this.server.close((err) => {
                    if (err) {
                        console.error(chalk.red('[Engine] Error stopping server:'), err);
                        return reject(err);
                    }
                    console.log(chalk.yellow('[Engine] Server stopped successfully.'));
                    this.server = null; // Clear the server instance
                    resolve();
                });
            } else {
                console.log(chalk.yellow('[Engine] Server object had no close method.'));
                this.server = null;
                resolve();
            }
        });
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
    // Top-level await is available in ES modules
    const startServer = async () => {
        // No need for external state manager at the top level
        const engineOptions = { unifiedIntelligenceService };

        if (process.env.USE_MOCK_AI === 'true') {
            console.log(chalk.yellow('--- [NOTICE] ---'));
            console.log(chalk.yellow('Running with USE_MOCK_AI=true. AI provider initialization will be skipped.'));
            console.log(chalk.yellow('This is for local testing and requires a mock function to be injected during tests.'));
            console.log(chalk.yellow('--- [NOTICE] ---'));
            engineOptions._test_streamText = true;
        }

        const engine = new Engine(engineOptions);
        await engine.start();
    };

    startServer().catch(error => {
        console.error(chalk.red(`[Engine] Failed to start: ${error.message}`));
        process.exit(1);
    });
}
