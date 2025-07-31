import express from "express";
import chalk from "chalk";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as stateManager from "./state_manager.js";
import { getCompletion } from "./llm_adapter.js";
import { execute as executeTool } from "./tool_executor.js";
import codeIntelligenceService from "../services/code_intelligence_service.js";
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

      try {
        console.log("[Engine] Triggering initial code indexing...");
        await codeIntelligenceService.scanAndIndexProject(process.cwd());
        console.log("[Engine] Code indexing complete.");
      } catch (error) {
        console.warn(
          chalk.yellow(
            "[Engine] Automatic code indexing failed. Code-aware features will be limited. Please check Neo4j connection and credentials."
          ),
          error.message
        );
      }

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

    // --- RECOMMENDED IMPROVEMENT: Log dispatcher thoughts for auditability ---
    if (agentId === "dispatcher") {
      console.log(chalk.magenta.bold(`[Dispatcher Thought] 🧠: ${response.thought}`));
    }
    // --------------------------------------------------------------------

    if (response.action?.tool) {
      return executeTool(response.action.tool, response.action.args, agentId);
    }
    return response.thought;
  }

  async dispatchAgentForState(state) {
    const status = state.project_status;
    console.log(chalk.yellow(`[Engine] Current project status: ${status}`));

    const autonomous_states = [
      "GRAND_BLUEPRINT_PHASE",
      "EXECUTION_IN_PROGRESS",
      "EXECUTION_FAILED",
    ];

    if (autonomous_states.includes(status)) {
      console.log(chalk.blue("[Engine] Dispatching @dispatcher to determine next action."));
      const stateJson = JSON.stringify(state, null, 2);
      const prompt = `System state has been updated. Analyze the current state and determine the next single, most logical action for the swarm.\n\nCURRENT STATE:\n${stateJson}`;
      return this.triggerAgent("dispatcher", prompt);
    } else {
      console.log(
        chalk.gray(
          `[Engine] No autonomous action required for status: ${status}. Waiting for user interaction or state change.`
        )
      );
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

async function main() {
  // --- FIX: Instantiate the engine HERE, inside the main execution block ---
  const engine = new Engine();

  const mcpServer = new McpServer({ name: "stigmergy-engine", version: "2.1.0" });
  await mcpServer.connect(new StdioServerTransport());
  console.log(chalk.bold("[MCP Server] Running in STDIO mode."));

  const PORT = process.env.PORT || 3000;

  engine.app.listen(PORT, async () => {
    console.log(chalk.bold(`[Server] Status API listening on http://localhost:${PORT}`));
    const state = await stateManager.getState();
    if (["GRAND_BLUEPRINT_PHASE", "EXECUTION_IN_PROGRESS"].includes(state.project_status)) {
      engine.start();
    }
  });
}

// Only run main when this file is executed directly
if (isMainModule) {
  main().catch(console.error);
}
