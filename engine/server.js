import { Hono } from 'hono';
import { serve, upgradeWebSocket } from '@hono/node-server';
import chalk from 'chalk';

// NOTE: Bun automatically loads .env files, so the explicit env_loader is no longer needed.
import stateManager from "../src/infrastructure/state/GraphStateManager.js";
import { createExecutor } from "./tool_executor.js";

export class Engine {
    constructor(options = {}) {
        this.app = new Hono();
        this.stateManager = stateManager;
        this.executeTool = createExecutor(this); // Assuming createExecutor is adapted or compatible
        // Mock or implement getAgent as needed
        this.getAgent = (agentId) => ({ id: agentId, systemPrompt: `Prompt for ${agentId}` });
        this.triggerAgent = async (agent, prompt) => {
            console.log(`Triggering ${agent.id} with: ${prompt}`);
        };

        this.setupRoutes();
    }

    setupRoutes() {
        // WebSocket upgrade route
        this.app.get('/ws', upgradeWebSocket((ws) => {
            console.log(chalk.blue('[WebSocket] Client connected'));

            ws.on('message', async (event) => {
                const message = event.data;
                try {
                    const data = JSON.parse(message);
                    // Your existing WebSocket message handling logic here
                    console.log(chalk.cyan(`[WebSocket] Received: ${data.type}`));

                    if (data.type === 'user_chat_message') {
                        const systemAgent = this.getAgent('system');
                        await this.triggerAgent(systemAgent, data.payload.prompt);
                    }
                    // Add other cases as needed
                } catch (error) {
                    console.error(chalk.red('[WebSocket] Error processing message:'), error);
                }
            });

            ws.on('close', () => {
                console.log(chalk.blue('[WebSocket] Client disconnected'));
            });
        }));

        // Basic API and static file serving (replace with your dashboard/api logic)
        this.app.get('/', (c) => c.text('Stigmergy Engine is running!'));

        // Example API endpoint
        this.app.get('/api/status', (c) => {
            return c.json({ status: 'ok', message: 'Engine is running' });
        });
    }

    async initialize() {
        console.log(chalk.blue("Initializing Stigmergy Engine..."));
        // Your existing initialization logic (health checks, etc.)
        return true;
    }

    broadcastEvent(type, payload) {
        // This needs to be adapted. Hono doesn't have a simple broadcast
        // You'll need to manage connected clients. For now, we can log it.
        console.log(`[Broadcast] Type: ${type}, Payload:`, payload);
    }

    async start() {
        await this.initialize();
        const PORT = process.env.STIGMERGY_PORT || 3010;

        serve({
            fetch: this.app.fetch,
            port: Number(PORT),
            websocket: true, // Enable WebSocket support
        }, (info) => {
            console.log(chalk.green(`🚀 Stigmergy Engine (Bun/Hono) server is running on http://localhost:${info.port}`));
        });
    }
}

// This part allows the file to be executed directly
if (import.meta.main) {
    const engine = new Engine();
    engine.start();
}
