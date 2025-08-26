import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import chalk from "chalk";
import * as stateManager from "./state_manager.js";
import { createExecutor } from "./tool_executor.js";
import "dotenv/config.js";
import { fileURLToPath } from 'url';
import { CodeIntelligenceService } from '../services/code_intelligence_service.js';
import { healthCheck as archonHealthCheck } from '../tools/archon_tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function geminiHealthCheck() {
  try {
    await execPromise('gemini --version');
    return { status: 'ok', message: 'Gemini CLI is installed and accessible.' };
  } catch (error) {
    return { status: 'not_found', message: 'Gemini CLI not found.' };
  }
}

export class Engine {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.app.use(express.json());
    this.stateManager = stateManager;
    this.codeIntelligence = new CodeIntelligenceService();
    this.executeTool = createExecutor(this);
    this.mainLoop = null;
    this.taskCounter = 0;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/api/chat', async (req, res) => {
        try {
            const { agentId, prompt } = req.body;
            const result = await this.triggerAgent(agentId, prompt);
            res.json({ response: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
  }

  async initialize() {
    console.log(chalk.blue("Auditing Connections..."));
    const [neo4jStatus, archonStatus, geminiStatus] = await Promise.all([
        this.codeIntelligence.testConnection(),
        archonHealthCheck(),
        geminiHealthCheck().catch(e => ({ status: 'error', message: e.message }))
    ]);

    const statusToChalk = {
        'ok': chalk.green('[✔]'),
        'error': chalk.red('[✖]'),
        'not_found': chalk.yellow('[!]'),
    };

    console.log(`
    --- System Connectivity Audit ---
    ${statusToChalk[neo4jStatus.status] || chalk.yellow('[?]')} Neo4j: ${neo4jStatus.message}
    ${statusToChalk[archonStatus.status] || chalk.yellow('[?]')} Archon Power Mode: ${archonStatus.message}
    ${statusToChalk[geminiStatus.status] || chalk.yellow('[?]')} Gemini CLI: ${geminiStatus.message}
    ---------------------------------
    `);

    return !Object.values({neo4jStatus, archonStatus}).some(s => s.status === 'error');
  }

  async start() {
    const PORT = process.env.PORT || 3000;
    this.server.listen(PORT, async () => {
        console.log(chalk.green(`🚀 Stigmergy Engine server running on http://localhost:${PORT}`));
    });

    // Mock loop for tests
    this.mainLoop = setInterval(async () => {
        const state = await this.stateManager.getState();
        if (state.status === 'EXECUTION_IN_PROGRESS' && state.pending_tasks.length > 0) {
            const task = state.pending_tasks[0];
            await this.triggerAgent('dispatcher', task);
            await this.executeTool(task.tool_name, task.tool_args, 'dispatcher');
            this.taskCounter++;
        }
        if (this.taskCounter >= 10) { // Threshold for self-improvement
            await this.stateManager.updateStatus({ newStatus: 'NEEDS_IMPROVEMENT' });
            this.taskCounter = 0;
        }
    }, 50);
  }

  async stop() {
    clearInterval(this.mainLoop);
    return new Promise((resolve) => {
        if (this.server.listening) {
            this.server.close(() => {
                console.log('Stigmergy Engine server stopped.');
                resolve();
            });
        } else {
            resolve();
        }
    });
  }

  async triggerAgent(agentId, prompt) {
    console.log(`[Engine] Triggering agent: @${agentId} with prompt: "${prompt}"`);
    // In a real system, this would call the llm_adapter
    return `Acknowledged. Task for @${agentId}: ${prompt}`;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const engine = new Engine();
    engine.initialize().then(success => {
        if (success) engine.start();
    });
}
