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
import fs from 'fs';
import { generateText } from 'ai';
import { getModelForTier } from '../ai/providers.js';
import config from "../stigmergy.config.js";
import dashboardRouter from "./dashboard.js";

const execPromise = promisify(exec);

async function geminiHealthCheck() {
    try {
        await execPromise('gemini --version');
        return { status: 'ok', message: 'Gemini CLI is installed and accessible.' };
    } catch (error) {
        return {
            status: 'error',
            message: 'Gemini CLI not found. The @gemini-executor agent will fail. Please ensure `gemini` is installed (`npm install -g @google/gemini-cli`) and that your system PATH includes the global npm binaries directory.'
        };
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
    const dispatcher = this.getAgent('dispatcher');

    // Do nothing if there's no defined status or if execution is paused/complete
    if (!state.project_status || ['PAUSED', 'EXECUTION_COMPLETE', 'HUMAN_INPUT_NEEDED'].includes(state.project_status)) {
      return;
    }

    // Construct the prompt for the dispatcher agent
    const prompt = `
      System State:
      - Project Status: ${state.project_status}
      - Pending Tasks: ${state.pending_tasks ? state.pending_tasks.length : 0}
      - Task History: ${state.task_history ? state.task_history.length : 0}

      Instructions:
      Based on the current system state and your core protocols, determine the single next action to take.
      Your response must be a single, executable tool call in JSON format.
      Example: {"tool": "stigmergy.task", "args": {"agentId": "analyst", "prompt": "Analyze the market"}}
    `;

    try {
      const response = await this.triggerAgent(dispatcher, prompt);

      // Basic response parsing (a more robust solution would use ai-sdk tools)
      const toolCallMatch = response.text.match(/\{[\s\S]*\}/);
      if (toolCallMatch) {
        const toolCall = JSON.parse(toolCallMatch[0]);
        if (toolCall.tool && toolCall.args) {
          console.log(chalk.magenta(`[Dispatcher] Decided to call tool: ${toolCall.tool}`));
          await this.executeTool(toolCall.tool, toolCall.args, 'dispatcher');
        } else {
            console.error(chalk.red("[Dispatcher] Invalid tool call format in response."), response.text);
        }
      } else {
        console.error(chalk.red("[Dispatcher] Did not return a tool call."), response.text);
      }
    } catch (error) {
      console.error(chalk.red("[Engine] Error during main loop dispatcher cycle:"), error);
    }
  }

  async start() {
    const PORT = process.env.PORT || 3010;
    this.server.listen(PORT, () => {
        console.log(chalk.green(`🚀 Stigmergy Engine API server is running on http://localhost:${PORT}`));
        console.log(chalk.blue(`   Watching project at: ${process.cwd()}`));
        console.log(chalk.yellow("   This is a headless engine. Interact with it via your IDE."));
    });
    // Increase interval to a more realistic value to avoid spamming the LLM
    this.mainLoopInterval = setInterval(() => this.runMainLoop(), 5000);
  }

  getAgent(agentId) {
    // In a real system, this would involve a more complex loading mechanism.
    // For now, we'll just load the markdown file and parse it.
    const agentPath = path.join(process.cwd(), '.stigmergy-core', 'agents', `${agentId}.md`);
    if (fs.existsSync(agentPath)) {
        const content = fs.readFileSync(agentPath, 'utf8');
        // A simple parser for the system prompt. A robust solution would parse the full YAML.
        const personaMatch = content.match(/identity: "(.*)"/);
        const systemPrompt = personaMatch ? personaMatch[1] : 'You are a helpful assistant.';
        const modelTierMatch = content.match(/model_tier: "(.*)"/);
        const modelTier = modelTierMatch ? modelTierMatch[1] : 'b_tier';
        return { id: agentId, systemPrompt, modelTier };
    }
    throw new Error(`Agent definition file not found for: ${agentId}`);
  }

  async triggerAgent(agent, userPrompt) {
    console.log(chalk.cyan(`[Engine] Triggering agent: @${agent.id}`));
    try {
        const model = getModelForTier(agent.modelTier);
        const { text } = await generateText({
            model,
            system: agent.systemPrompt,
            prompt: userPrompt,
        });
        return { text };
    } catch (error) {
        if (error.message.includes("API key environment variable")) {
            console.error(chalk.red(`[Engine] Missing API Key for tier ${agent.modelTier}. Please check your .env file.`));
            // Return a "do nothing" tool call to prevent the engine from crashing.
            return { text: '{"tool": "log", "args": {"message": "Agent trigger failed due to missing API key."}}' };
        }
        console.error(chalk.red(`[AI Provider] Error during generation for @${agent.id}:`), error);
        return { error: error.message };
    }
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