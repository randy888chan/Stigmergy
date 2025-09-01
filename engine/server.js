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
import { generateText, generateObject } from 'ai';
import { z } from 'zod';
import { getModelForTier } from '../ai/providers.js';
import config from "../stigmergy.config.js";
import dashboardRouter from "./dashboard.js";
import yaml from 'js-yaml';

const execPromise = promisify(exec);

const stigmergyToolCallSchema = z.object({
  tool: z.string().describe("The name of the tool to call, e.g., 'stigmergy.task'"),
  args: z.record(z.any()).describe("The arguments for the tool, as an object."),
});


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
            const agent = this.getAgent(agentId);
            const result = await this.triggerAgent(agent, prompt);
            res.json({ response: result });
        } catch (error) {
            console.error(chalk.red(`[API Error] ${error.message}`));
            res.status(500).json({ error: error.message });
        }
    });
  }

  async initialize() {
    console.log(chalk.blue("Initializing Stigmergy Engine and Auditing Connections..."));

    // Check environment variables first
    const requiredEnvVars = this.getRequiredEnvVars();
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(chalk.red(`[✖] Missing required environment variables: ${missingVars.join(', ')}`));
        console.error(chalk.yellow("Please copy .env.example to .env and configure your API keys."));
        return false;
    }

    const archon = await archonHealthCheck();
    if (archon.status === 'ok') {
        console.log(chalk.green(`[✔] Archon Power Mode: ${archon.message}`));
    } else {
        console.log(chalk.yellow(`[!] Archon Power Mode: ${archon.message} (Will use standard research tools).`));
    }

    const neo4j = await this.codeIntelligence.testConnection();
    if (neo4j.status === 'ok') {
        console.log(chalk.green(`[✔] Neo4j: ${neo4j.message}`));
        if (neo4j.version) {
            console.log(chalk.blue(`    Version: ${neo4j.version}`));
        }
    } else {
        console.log(chalk.red(`[✖] Neo4j: ${neo4j.message}`));
        if (config.features.neo4j === 'required') {
            console.error(chalk.red("Neo4j is required but not available. Please check your configuration."));
            if (neo4j.recovery_suggestions) {
                console.log(chalk.yellow("Recovery suggestions:"));
                neo4j.recovery_suggestions.forEach(suggestion => {
                    console.log(chalk.yellow(`  • ${suggestion}`));
                });
            }
            return false;
        }
        console.log(chalk.yellow("Continuing with in-memory state management."));
    }

    const gemini = await geminiHealthCheck();
    if (gemini.status === 'ok') {
        console.log(chalk.green(`[✔] Gemini CLI: ${gemini.message}`));
    } else {
        console.log(chalk.yellow(`[!] Gemini CLI: ${gemini.message}`));
    }

    return true;
  }

  getRequiredEnvVars() {
    const requiredVars = [];
    
    Object.values(config.model_tiers).forEach(tier => {
        if (tier.api_key_env) requiredVars.push(tier.api_key_env);
    });
    
    // Add Neo4j if required
    if (config.features.neo4j === 'required') {
        requiredVars.push('NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD');
    }
    
    return [...new Set(requiredVars)]; // Remove duplicates
  }

  async runMainLoop() {
    const state = await this.stateManager.getState();
    const dispatcher = this.getAgent('dispatcher');

    if (!state.project_status || ['PAUSED', 'EXECUTION_COMPLETE', 'HUMAN_INPUT_NEEDED', 'NEEDS_INITIALIZATION'].includes(state.project_status)) {
      return;
    }

    const allTasks = state.project_manifest?.tasks || [];
    const pendingTasks = allTasks.filter(t => t.status === 'PENDING');
    const completedTasks = allTasks.filter(t => t.status === 'COMPLETED');

    const prompt = `
      System State:
      - Project Status: ${state.project_status}
      - All Tasks: ${allTasks.length}
      - Pending Tasks (${pendingTasks.length}): ${pendingTasks.map(t => t.description).join('; ') || 'None'}
      - Completed Tasks (${completedTasks.length}): ${completedTasks.map(t => t.description).join('; ') || 'None'}

      Instructions:
      Based on the current system state and your core protocols, determine the single next action to take by calling the appropriate tool.
    `;

    try {
      const { toolCall } = await this.triggerAgent(dispatcher, prompt);

      if (toolCall && toolCall.tool && toolCall.args) {
        console.log(chalk.magenta(`[Dispatcher] Decided to call tool: ${toolCall.tool} with args:`, toolCall.args));
        await this.executeTool(toolCall.tool, toolCall.args, 'dispatcher');
      } else {
        console.error(chalk.red("[Dispatcher] Did not return a valid tool call."), toolCall);
        // Add a state update to prevent getting stuck in a loop on failure
        await this.stateManager.updateStatus({ newStatus: "HUMAN_INPUT_NEEDED", message: "Dispatcher failed to produce a valid tool call." });
      }
    } catch (error) {
      console.error(chalk.red("[Engine] Error during main loop dispatcher cycle:"), error);
       await this.stateManager.updateStatus({ newStatus: "HUMAN_INPUT_NEEDED", message: `Dispatcher cycle failed: ${error.message}` });
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
    const agentPath = path.join(process.cwd(), '.stigmergy-core', 'agents', `${agentId}.md`);
    if (!fs.existsSync(agentPath)) {
      throw new Error(`Agent definition file not found for: ${agentId}`);
    }

    const content = fs.readFileSync(agentPath, 'utf8');
    const yamlMatch = content.match(/```yaml\s*([\s\S]*?)```/);
    if (!yamlMatch) {
      throw new Error(`Could not find YAML block in agent definition for: ${agentId}`);
    }

    try {
      const agentData = yaml.load(yamlMatch[1]);
      const persona = agentData.agent?.persona;
      const protocols = agentData.agent?.core_protocols;

      if (!persona || !protocols) {
        throw new Error(`Agent ${agentId} is missing persona or core_protocols.`);
      }

      // Construct a comprehensive system prompt
      const systemPrompt = `
        **Identity:** ${persona.identity}
        **Role:** ${persona.role}
        **Style:** ${persona.style}

        **Core Protocols (MUST be followed at all times):**
        ${protocols.join('\n\n')}
      `.trim();

      const modelTier = agentData.agent?.model_tier || 'b_tier';

      return { id: agentId, systemPrompt, modelTier };
    } catch (e) {
      console.error(chalk.red(`Error parsing YAML for agent ${agentId}: ${e.message}`));
      throw new Error(`Failed to parse agent definition for: ${agentId}`);
    }
  }

  async triggerAgent(agent, userPrompt) {
    console.log(chalk.cyan(`[Engine] Triggering agent: @${agent.id}`));
    try {
      const model = getModelForTier(agent.modelTier);

      // Use generateObject for structured, predictable output
      const { object } = await generateObject({
        model,
        schema: stigmergyToolCallSchema,
        system: agent.systemPrompt,
        prompt: userPrompt,
      });

      return { toolCall: object };
    } catch (error) {
      if (error.message.includes("API key environment variable")) {
        console.error(chalk.red(`[Engine] Missing API Key for tier ${agent.modelTier}. Please check your .env file.`));
        // Return a "do nothing" tool call to prevent the engine from crashing.
        return { toolCall: { tool: 'log', args: { message: `Agent @${agent.id} trigger failed due to missing API key for tier ${agent.modelTier}.` } } };
      }
      console.error(chalk.red(`[AI Provider] Error during generation for @${agent.id}:`), error);
      // Return a structured error to be handled by the main loop
      return { error: error.message, toolCall: null };
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
