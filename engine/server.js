import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import chalk from "chalk";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from 'url';
import "dotenv/config.js";

import * as stateManager from "./state_manager.js";
import { createExecutor } from "./tool_executor.js";
import { CodeIntelligenceService } from '../services/code_intelligence_service.js';
import { healthCheck as archonHealthCheck } from '../tools/archon_tool.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import config from "../stigmergy.config.js";

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function geminiHealthCheck() {
    try {
        await execPromise('gemini --version');
        return { status: 'ok', message: 'Gemini CLI is installed and accessible.' };
    } catch (error) {
        return { status: 'error', message: 'Gemini CLI not found. The @gemini-executor agent will fail.' };
    }
}

export class Engine {
  constructor({ isPowerMode = false } = {}) {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    
    this.isPowerMode = isPowerMode;
    this.stateManager = stateManager;
    this.codeIntelligence = new CodeIntelligenceService();
    this.executeTool = createExecutor(this);

    this.isEngineRunning = false;
    this.taskCounter = 0;

    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    // This is the crucial part for serving a frontend.
    // It tells Express to look for static files (like CSS, JS, images) in the 'dist' directory.
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
        console.log(chalk.blue(`[Server] Found 'dist' directory. Serving static files from: ${distPath}`));
        this.app.use(express.static(distPath));
    } else {
        console.log(chalk.yellow("[Server] No 'dist' directory found. The engine will run in headless API-only mode."));
    }
  }

  setupRoutes() {
    this.app.post('/api/chat', async (req, res) => {
        try {
            const { agentId, prompt } = req.body;
            console.log(chalk.green(`[API] Received request for @${agentId}`));
            const result = await this.triggerAgent(agentId, prompt);
            res.json({ response: result });
        } catch (error) {
            console.error(chalk.red(`[API Error] ${error.message}`));
            res.status(500).json({ error: error.message });
        }
    });

    // This catch-all route is the key to making Single-Page Applications (SPAs) work.
    // Any request that doesn't match an API route will serve the index.html file.
    const indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (fs.existsSync(indexPath)) {
        this.app.get('*', (req, res) => {
            res.sendFile(indexPath);
        });
    }
  }

  async initialize() {
    console.log(chalk.blue("Initializing Stigmergy Engine and Auditing Connections..."));
    if (this.isPowerMode) {
        console.log(chalk.yellow.bold("POWER MODE ENGAGED. Archon connection is required."));
    }
    
    const [neo4jStatus, archonStatus, geminiStatus] = await Promise.all([
        this.codeIntelligence.testConnection(),
        archonHealthCheck(),
        geminiHealthCheck()
    ]);
    
    let healthy = true;
    
    console.log(chalk.bold("\n--- System Connectivity Audit ---"));
    
    // Print Neo4j Status
    if (neo4jStatus.status === 'ok') {
        console.log(chalk.green(`[✔] Neo4j: ${neo4jStatus.message}`));
    } else {
        console.log(chalk.red(`[✖] Neo4j: ${neo4jStatus.message}`));
        if (config.features.neo4j === 'required') healthy = false;
    }

    // Print Archon Status
    if (archonStatus.status === 'ok') {
        console.log(chalk.green(`[✔] Archon Power Mode: ${archonStatus.message}`));
    } else {
        if (this.isPowerMode) {
            console.log(chalk.red(`[✖] Archon Power Mode: ${archonStatus.message} (Required in Power Mode).`));
            healthy = false;
        } else {
            console.log(chalk.yellow(`[!] Archon Power Mode: ${archonStatus.message} (Will use standard research tools).`));
        }
    }

    // Print Gemini CLI Status
    if (geminiStatus.status === 'ok') {
        console.log(chalk.green(`[✔] Gemini CLI: ${geminiStatus.message}`));
    } else {
        console.log(chalk.yellow(`[!] Gemini CLI: ${geminiStatus.message}`));
    }
    
    console.log(chalk.bold("---------------------------------\n"));
    
    return healthy;
  }

  async start() {
    const PORT = process.env.PORT || 3000;
    this.server.listen(PORT, () => {
        console.log(chalk.green(`🚀 Stigmergy Engine server is running on http://localhost:${PORT}`));
        // Autonomous loop can be started here if needed in the future
    });
  }

  async triggerAgent(agentId, prompt) {
    console.log(`[Engine] Triggering agent: @${agentId}`);
    // In a real system, this would call the llm_adapter
    return `Acknowledged task for @${agentId}.`;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const engine = new Engine();
    engine.initialize().then(success => {
        if (success) {
            engine.start();
        } else {
            console.error(chalk.red("Engine initialization failed critical checks. Aborting startup."));
            process.exit(1);
        }
    });
}