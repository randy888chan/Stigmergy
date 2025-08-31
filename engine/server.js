import "dotenv/config";
import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import chalk from "chalk";
import { fileURLToPath } from 'url';
import path from 'path';

import * as stateManager from "./state_manager.js";
import { createExecutor } from "./tool_executor.js";
import { CodeIntelligenceService } from '../services/code_intelligence_service.js';
import { healthCheck as archonHealthCheck } from '../tools/archon_tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from "../stigmergy.config.js";
import dashboardRouter from "./dashboard.js";

const execPromise = promisify(exec);

async function geminiHealthCheck() {
    try {
        await execPromise('gemini --version');
        return { status: 'ok', message: 'Gemini CLI is installed and accessible.' };
    } catch (error) {
        return { status: 'error', message: 'Gemini CLI not found. The @gemini-executor agent will fail.' };
    }
}

const SELF_IMPROVEMENT_CYCLE = 10;

export class Engine {
  constructor({ isPowerMode = false } = {}) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.isPowerMode = isPowerMode;
    this.stateManager = stateManager;
    this.codeIntelligence = new CodeIntelligenceService();
    this.executeTool = createExecutor(this);

    this.mainLoopInterval = null;
    this.taskCounter = 0;
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws:;"
      );
      next();
    });
  }

  setupRoutes() {
    this.app.use('/', dashboardRouter);
    this.app.post('/api/chat', async (req, res) => {
        try {
            const { agentId, prompt } = req.body;
            console.log(chalk.green(`[API] Received request for @${agentId}: "${prompt}"`));
            const result = await this.triggerAgent(agentId, prompt);
            res.json({ response: result });
        } catch (error) {
            console.error(chalk.red(`[API Error] ${error.message}`));
            res.status(500).json({ error: error.message });
        }
    });
  }

  async initialize() {
    console.log(chalk.blue("Initializing Stigmergy Engine and Auditing Connections..."));

    const archon = await archonHealthCheck();
    if (archon.status === 'ok') {
        console.log(chalk.green(`[✔] Archon Power Mode: ${archon.message}`));
    } else {
        console.log(chalk.yellow(`[!] Archon Power Mode: ${archon.message} (Will use standard research tools).`));
    }

    const neo4j = await this.codeIntelligence.testConnection();
    if (neo4j.status === 'ok') {
        console.log(chalk.green(`[✔] Neo4j: ${neo4j.message}`));
    } else {
        console.log(chalk.red(`[✖] Neo4j: ${neo4j.message}`));
        if (config.features.neo4j === 'required') {
            return false; // Hard fail
        }
    }

    const gemini = await geminiHealthCheck();
    if (gemini.status === 'ok') {
        console.log(chalk.green(`[✔] Gemini CLI: ${gemini.message}`));
    } else {
        console.log(chalk.yellow(`[!] Gemini CLI: ${gemini.message}`));
    }

    return true;
  }

  async runMainLoop() {
    const state = await this.stateManager.getState();

    if (state.status === 'EXECUTION_IN_PROGRESS' && state.pending_tasks && state.pending_tasks.length > 0) {
        const task = state.pending_tasks[0];
        // This is a simplified execution model for the test.
        // A real implementation would involve more complex dispatching.
        await this.triggerAgent('dispatcher', task);
        await this.executeTool(task.tool_name, task.tool_args, 'dispatcher');

        this.taskCounter++;
        if (this.taskCounter >= SELF_IMPROVEMENT_CYCLE) {
            await this.stateManager.updateStatus({ newStatus: 'NEEDS_IMPROVEMENT' });
            this.taskCounter = 0;
        }
    }
  }

  async start() {
    const PORT = process.env.PORT || 3010;
    this.server.listen(PORT, () => {
        console.log(chalk.green(`🚀 Stigmergy Engine API server is running on http://localhost:${PORT}`));
        console.log(chalk.blue(`   Watching project at: ${process.cwd()}`));
        console.log(chalk.yellow("   This is a headless engine. Interact with it via your IDE."));
    });
    this.mainLoopInterval = setInterval(() => this.runMainLoop(), 50);
  }

  async triggerAgent(agentId, prompt) {
    console.log(`[Engine] Triggering agent: @${agentId}`);
    return `Task for @${agentId} acknowledged.`;
  }

  stop() {
    return new Promise((resolve) => {
      if (this.mainLoopInterval) {
        clearInterval(this.mainLoopInterval);
      }
      this.server.close(() => {
        console.log('Stigmergy Engine server stopped.');
        resolve();
      });
    });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const engine = new Engine();
    engine.initialize().then(success => {
        if (success) {
            engine.start();
        } else {
            console.error(chalk.red("Engine initialization failed critical checks. Aborting."));
            process.exit(1);
        }
    });
}