import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import chalk from 'chalk';
import stateManager from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import fs from 'fs-extra';
import path from 'path';
import config from '../stigmergy.config.js';
import { getAiProviders } from '../ai/providers.js';

export class Engine {
    constructor(stateManagerInstance, options = {}) {
        if (!stateManagerInstance) {
            throw new Error("Engine requires a StateManager instance.");
        }
        this.app = new Hono();
        this.stateManager = stateManagerInstance;
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

        const filePath = path.join(process.cwd(), 'output.js');
        const fileContent = "console.log('Hello, Stigmergy!');";
        await fs.writeFile(filePath, fileContent);
        console.log(chalk.green(`[Engine] Mock Executor has written file: ${filePath}`));

        await this.stateManager.updateStatus({ newStatus: 'EXECUTION_COMPLETE', message: 'Workflow finished.' });
    }

    setupRoutes() {
        const engineInstance = this;
        const { upgradeWebSocket } = createNodeWebSocket({ app: this.app });

        this.app.get('/ws', upgradeWebSocket((c) => {
            return {
                onOpen: (evt, ws) => {
                    console.log(chalk.blue('[WebSocket] Client connected'));
                    engineInstance.clients.add(ws);
                },
                onMessage: async (evt, ws) => {
                    try {
                        const data = JSON.parse(evt.data);
                        if (data.type === 'user_chat_message') {
                            await engineInstance.executeGoal(data.payload.prompt);
                        }
                    } catch (error) {
                        console.error(chalk.red('[WebSocket] Error processing message:'), error);
                    }
                },
                onClose: (evt, ws) => {
                    console.log(chalk.blue('[WebSocket] Client disconnected'));
                    engineInstance.clients.delete(ws);
                },
            };
        }));
        
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
        const PORT = process.env.STIGMERGY_PORT || 3010;
        
        return new Promise((resolve) => {
            // THIS IS THE CRITICAL FIX:
            // The `serve` function must be explicitly told to handle WebSockets.
            this.server = serve({
                fetch: this.app.fetch,
                port: Number(PORT),
                websocket: true, // This line enables the WebSocket server.
            }, (info) => {
                console.log(chalk.green(`🚀 Stigmergy Engine (Bun/Hono) server is running on http://localhost:${info.port}`));
                resolve();
            });
        });
    }

    async stop() {
        return new Promise((resolve) => {
            if (this.server && this.server.close) {
                this.server.close(() => {
                    console.log(chalk.yellow('[Engine] Server stopped.'));
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }
}

// This block ensures the server can run directly for production
if (import.meta.main) {
    const mainStateManager = await import("../src/infrastructure/state/GraphStateManager.js").then(m => m.default);
    const engine = new Engine(mainStateManager);
    engine.start();
}