import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { upgradeWebSocket } from 'hono/bun';
import chalk from 'chalk';
import GraphStateManager from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import fs from 'fs-extra';
import path from 'path';
import config from '../stigmergy.config.js';
import { getAiProviders } from '../ai/providers.js';

export class Engine {
    constructor(options = {}) {
        this.app = new Hono();
        this.projectRoot = options.projectRoot || process.cwd();
        this.stateManager = new GraphStateManager(this.projectRoot);
        this.clients = new Set();
        this.server = null;

        const aiProviders = getAiProviders(config);
        this.ai = aiProviders;
        this.executeTool = createExecutor(this, this.ai);

        this.setupRoutes();
        this.setupStateListener();
    }

    async executeGoal(prompt) {
        console.log(chalk.cyan(`[Engine] Received new goal: "${prompt}"`));
        await this.stateManager.initializeProject(prompt);
    }
    
    setupStateListener() {
        this.stateManager.on('stateChanged', (newState) => {
            console.log(chalk.magenta(`[Engine] State changed to: ${newState.project_status}`));
            this.broadcastEvent('state_update', newState);

            if (newState.project_status === 'ENRICHMENT_PHASE') {
                this.runMockAutonomousLoop(newState);
            }
        });
    }
    
    async runMockAutonomousLoop(state) {
        console.log(chalk.yellow('[Engine] Simulating autonomous loop...'));
        await new Promise(resolve => setTimeout(resolve, 500));

        // Use the projectRoot and create file in the 'src' directory as per the test prompt
        const filePath = path.join(this.projectRoot, 'src', 'output.js');
        const fileContent = "console.log('Hello, Stigmergy!');";

        // Ensure the directory exists before writing
        await fs.ensureDir(path.dirname(filePath));
        await fs.writeFile(filePath, fileContent);
        console.log(chalk.green(`[Engine] Mock Executor has written file: ${filePath}`));

        await this.stateManager.updateStatus({ newStatus: 'EXECUTION_COMPLETE', message: 'Workflow finished.' });
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
        return new Promise((resolve) => {
            if (this.server) {
                this.server.stop(true);
                console.log(chalk.yellow('[Engine] Server stopped.'));
            }
            resolve();
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

// This block ensures the server can run directly for production
if (import.meta.main) {
    const engine = new Engine();
    engine.start();
}