import express from "express";
import chalk from "chalk";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as stateManager from "./state_manager.js";
import { getCompletion } from "./llm_adapter.js";
import { execute as executeTool } from "./tool_executor.js";
import config from "../stigmergy.config.js";
import "dotenv/config.js";
import { fileURLToPath } from "url";
import path from "path";

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.engineLoopHandle = null;
    this.app = express();
    this.app.use(express.json());
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post("/api/system/start", async (req, res) => {
      const { goal } = req.body;
      if (!goal) return res.status(400).json({ error: "'goal' is required." });
      await stateManager.initializeProject(goal);
      this.start();
      res.json({ message: "Project initiated." });
    });
    this.app.post("/api/control/pause", async (req, res) => {
      await this.stop("Paused by user");
      await stateManager.pauseProject();
      res.json({ message: "Engine has been paused." });
    });
    this.app.post("/api/control/resume", async (req, res) => {
      await stateManager.resumeProject();
      this.start();
      res.json({ message: "Engine has been resumed." });
    });
  }

  async triggerAgent(agentId, prompt, taskId = null) {
    const response = await getCompletion(agentId, prompt, taskId);
    if (response.action?.tool) {
      return executeTool(response.action.tool, response.action.args, agentId);
    }
    return response.thought;
  }

  async dispatchAgentForState(state) {
    const status = state.project_status;
    console.log(chalk.yellow(`[Engine] Current project status: ${status}`));

    const artifacts = state.artifacts_created || {};

    switch (status) {
      case 'GRAND_BLUEPRINT_PHASE':
        if (!artifacts.brief) {
          console.log(chalk.blue('[Engine] Dispatching @analyst to create project brief.'));
          return this.triggerAgent('analyst', 'The project has been initialized. Your task is to perform research and create the project brief, market research, and competitor analysis documents.');
        }
        if (!artifacts.prd) {
          console.log(chalk.blue('[Engine] Dispatching @pm to create PRD.'));
          return this.triggerAgent('pm', 'The brief is complete. Your task is to create the Product Requirements Document (PRD).');
        }
        if (!artifacts.architecture) {
          console.log(chalk.blue('[Engine] Dispatching @design-architect to create architecture.'));
          return this.triggerAgent('design-architect', 'The PRD is complete. Your task is to create the technical architecture documents.');
        }
        // NOTE: You can add a step for the @design agent here if needed.
        console.log(chalk.green('[Engine] All planning documents generated. Awaiting user approval.'));
        await stateManager.updateStatus('AWAITING_EXECUTION_APPROVAL', 'Blueprint complete. Please review all documents in the `docs/` directory and approve execution.');
        break;

      case 'AWAITING_EXECUTION_APPROVAL':
        console.log(chalk.cyan('[Engine] Paused. Waiting for user to approve execution via a message to @saul (the dispatcher).'));
        // The trigger for the next step is an external user message. No autonomous action needed here.
        break;

      case 'EXECUTION_IN_PROGRESS':
        const nextTask = state.project_manifest?.tasks?.find(t => t.status === 'PENDING');
        if (nextTask) {
          console.log(chalk.blue(`[Engine] Dispatching executor for task: ${nextTask.id}`));
          const executor = config.executor_preference === 'gemini' ? 'gemini-executor' : 'dev';
          return this.triggerAgent(executor, `Execute task: ${nextTask.summary}`, nextTask.id);
        } else {
          console.log(chalk.green('[Engine] All tasks have been executed.'));
          await stateManager.updateStatus('PROJECT_COMPLETE', 'All tasks have been executed successfully.');
        }
        break;
      
      case 'PROJECT_COMPLETE':
        console.log(chalk.magentaBright('[Engine] Project is complete. The system is now idle.'));
        this.stop("Project Complete");
        break;

      default:
        console.log(chalk.gray(`[Engine] No autonomous action required for status: ${status}`));
    }
  }

  async runLoop() {
    if (!this.isEngineRunning) return;
    try {
      const state = await stateManager.getState();
      await this.dispatchAgentForState(state);
    } catch (error) {
      console.error(chalk.red("[Engine] Error in loop:"), error);
      await this.stop("Error");
    }
    if (this.isEngineRunning) {
      this.engineLoopHandle = setTimeout(() => this.runLoop(), 5000);
    }
  }

  start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Engine Engaged ---\n"));
    this.runLoop();
  }

  async stop(reason) {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false;
    if (this.engineLoopHandle) clearTimeout(this.engineLoopHandle);
    console.log(chalk.bold.red(`\n--- Stigmergy Engine Disengaged (Reason: ${reason}) ---\n`));
  }
}

const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
const engine = new Engine();

async function main() {
  const mcpServer = new McpServer({ name: "stigmergy-engine", version: "2.1.0" });
  await mcpServer.connect(new StdioServerTransport());
  console.log(chalk.bold("[MCP Server] Running in STDIO mode."));

  const PORT = process.env.PORT || 3000;

  if (isMainModule) {
    engine.app.listen(PORT, async () => {
      console.log(chalk.bold(`[Server] Status API listening on http://localhost:${PORT}`));
      const state = await stateManager.getState();
      if (["GRAND_BLUEPRINT_PHASE", "EXECUTION_IN_PROGRESS"].includes(state.project_status)) {
        engine.start();
      }
    });
  }
}

if (isMainModule) {
  main().catch(console.error);
}

export const app = engine.app;
