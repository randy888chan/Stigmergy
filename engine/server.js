import express from "express";
import chalk from "chalk";
import { Server as McpServer } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as stateManager from "./state_manager.js";
import { getCompletion } from "./llm_adapter.js";
import { createExecutor } from "./tool_executor.js";
import codeIntelligenceService from "../services/code_intelligence_service.js";
import dashboardRouter from "./dashboard.js";
import "dotenv/config.js";
import { fileURLToPath } from "url";
import path from "path";
import boxen from "boxen";
import { readFileSync } from "fs";
import config from "../stigmergy.config.js";
import { Spinner } from "cli-spinner";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.engineLoopHandle = null;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.get("/", async (req, res) => {
      const neo4jStatus = await codeIntelligenceService.testConnection();
      res.json({
        status: "Stigmergy Engine is running.",
        engineStatus: this.isEngineRunning ? "ENGAGED" : "IDLE",
        neo4jConnection: neo4jStatus,
        version: pkg.version,
      });
    });

    this.app.get("/api/system/health", async (req, res) => {
      const neo4jStatus = await codeIntelligenceService.testConnection();
      const healthStatus = {
        engine: "RUNNING",
        dependencies: {
          neo4j: {
            connected: neo4jStatus.success,
            message: neo4jStatus.success ? "Connection successful." : neo4jStatus.error,
          },
        },
      };
      res.status(neo4jStatus.success ? 200 : 503).json(healthStatus);
    });

    this.app.use("/dashboard", dashboardRouter);

    this.app.post("/api/chat", async (req, res) => {
      const { agentId, prompt, taskId } = req.body;
      if (!agentId || !prompt) {
        return res.status(400).json({ error: "agentId and prompt are required." });
      }
      try {
        const result = await this.triggerAgent(agentId, prompt, taskId);
        res.json({ response: result });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });
  }

  async logSystemStatus() {
    const neo4jStatus = await codeIntelligenceService.testConnection();
    const firecrawlStatus = process.env.FIRECRAWL_KEY ? "✓ Ready" : "⚠ Disabled";
    const aiModel = process.env.AI_MODEL || "Not configured";

    const statusMessage = [
      chalk.green.bold("Stigmergy Engine Status"),
      `Version: ${pkg.version}`,
      `PID: ${process.pid}`,
      `Node: ${process.version}`,
      `Environment: ${process.env.NODE_ENV || "development"}`,
      "",
      chalk.bold("Services:"),
      `- Neo4j: ${neo4jStatus.success ? chalk.green("✓ Connected") : chalk.red("✗ Disconnected")}`,
      `- AI Provider: ${chalk.cyan(aiModel)}`,
      `- Research Tool: ${firecrawlStatus}`,
      "",
      chalk.dim(`Listening on port ${process.env.PORT || 3000}`),
    ].join("\n");

    console.log(
      boxen(statusMessage, {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: neo4jStatus.success ? "green" : "red",
        title: "System Startup",
        titleAlignment: "center",
      })
    );

    if (!neo4jStatus.success) {
      console.error(
        boxen(
          [
            chalk.red.bold("CRITICAL DATABASE ERROR"),
            "",
            "Engine cannot function without Neo4j connection.",
            "",
            chalk.yellow("Troubleshooting Steps:"),
            "1. Ensure Neo4j Desktop is running",
            "2. Verify database is active (green status)",
            "3. Check credentials in .env file",
            "4. Run " + chalk.cyan("npm run test:neo4j") + " to diagnose",
            "",
            chalk.dim(`Error: ${neo4jStatus.error}`),
          ].join("\n"),
          {
            padding: 1,
            margin: 1,
            borderStyle: "double",
            borderColor: "red",
          }
        )
      );
    }
  }

  async triggerAgent(agentId, prompt, taskId = null) {
    const response = await getCompletion(agentId, prompt, taskId);

    if (agentId === "dispatcher" && response.thought) {
      console.log(chalk.magenta.bold(`[Dispatcher Thought] 🧠: ${response.thought}`));
    }

    if (response.action?.tool) {
      return this.executeTool(response.action.tool, response.action.args, agentId);
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
    const spinner = new Spinner({
      text: "Processing tasks %s",
      stream: process.stderr,
      onTick: function (msg) {
        this.clearLine(this.stream);
        this.stream.write(msg);
      },
    });

    spinner.setSpinnerString("|/-\\");
    spinner.start();

    try {
      while (this.isEngineRunning) {
        const state = await stateManager.getState();
        spinner.text = `[${state.project_status}] ${state.currentTask || "Preparing..."}`;

        await this.dispatchAgentForState(state);

        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    } catch (error) {
      console.error(chalk.red("[Engine] Error in loop:"), error);
      await this.stop("Error");
    } finally {
      spinner.stop(true);
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

export async function main() {
  const engine = new Engine();
  const mcpServer = new McpServer({ name: "stigmergy-engine", version: pkg.version });

  // Show system status before starting
  await engine.logSystemStatus();

  // Enable incremental indexing
  await codeIntelligenceService.enableIncrementalIndexing(process.cwd());

  const neo4jStatus = await codeIntelligenceService.testConnection();
  if (!neo4jStatus.success) {
    process.exit(1);
  }

  try {
    console.log(chalk.blue("[Engine] Starting initial code indexing..."));
    await codeIntelligenceService.scanAndIndexProject(process.cwd());
    console.log(chalk.green("[Engine] Code indexing complete."));
  } catch (error) {
    console.error(chalk.red.bold("Failed to index project during startup."), error);
    process.exit(1);
  }

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
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
