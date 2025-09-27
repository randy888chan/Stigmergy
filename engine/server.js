import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { createNodeWebSocket } from '@hono/node-ws';
import chalk from 'chalk';
// CORRECT: Import the real State Manager directly.
import stateManager from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";
import fs from 'fs-extra';
import path from 'path';
import config from '../stigmergy.config.js';
import { getAiProviders } from '../ai/providers.js';

export class Engine {
    constructor(options = {}) {
        this.app = new Hono();
        // CORRECT: Use the real state manager instance.
        this.stateManager = stateManager;
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
        // CORRECT: Call the method directly on the GraphStateManager.
        await this.stateManager.initializeProject(prompt);
    }
    
    setupStateListener() {
        // CORRECT: The listener is now directly on the source of the event.
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
        const { upgradeWebSocket, wss } = createNodeWebSocket({ app: this.app });

        this.app.get('/ws', upgradeWebSocket((ws) => {
            console.log(chalk.blue('[WebSocket] Client connected'));
            this.clients.add(ws);

            ws.on('message', async (event) => {
                const message = event.data;
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'user_chat_message') {
                        await this.executeGoal(data.payload.prompt);
                    }
                } catch (error) {
                    console.error(chalk.red('[WebSocket] Error processing message:'), error);
                }
            });

            ws.on('close', () => {
                console.log(chalk.blue('[WebSocket] Client disconnected'));
                this.clients.delete(ws);
            });
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
            this.server = serve({
                fetch: this.app.fetch,
                port: Number(PORT),
                websocket: true,
            }, (info) => {
                console.log(chalk.green(`🚀 Stigmergy Engine (Bun/Hono) server is running on http://localhost:${info.port}`));
                resolve();
            });
        });
    }

    async stop() {
        // This makes the stop method more robust.
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

if (import.meta.main) {
    const engine = new Engine();
    engine.start();
}
