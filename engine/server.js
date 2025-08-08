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
import { LightweightHealthMonitor } from "../src/monitoring/lightweightHealthMonitor.js";
import * as AgentPerformance from "./agent_performance.js";
const swarmMemory = require("./swarm_memory.js");

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
    this.healthMonitor = new LightweightHealthMonitor();
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
        console.error("Error in /api/chat:", error);
        res.status(500).json({ error: error.message, stack: error.stack });
      }
    });

    this.app.post("/api/control/pause", async (req, res) => {
      try {
        await stateManager.pauseProject();
        this.stop("Paused by user API request");
        res.status(200).json({ message: "Engine paused successfully." });
      } catch (error) {
        console.error("Error pausing engine:", error);
        res.status(500).json({ error: "Failed to pause engine." });
      }
    });

    this.app.post("/api/control/resume", async (req, res) => {
      try {
        await stateManager.resumeProject();
        this.start();
        res.status(200).json({ message: "Engine resumed successfully." });
      } catch (error) {
        console.error("Error resuming engine:", error);
        res.status(500).json({ error: "Failed to resume engine." });
      }
    });
  }

  async triggerAgent(agentId, prompt, taskId = null) {
    this.healthMonitor.recordHealth(agentId, "healthy", { prompt: prompt.substring(0, 100) });
    const response = await getCompletion(agentId, prompt, taskId);

    if (agentId === "dispatcher" && response.thought) {
      console.log(chalk.magenta.bold(`[Dispatcher Thought] 🧠: ${response.thought}`));
    }

    if (response.action?.tool) {
      const result = await this.executeTool(response.action.tool, response.action.args, agentId);
      swarmMemory.recordLesson({
        agentId,
        taskType: response.action.tool,
        success: result.success,
      });
      return result;
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
      let prompt = `System state has been updated. Analyze the current state and determine the next single, most logical action for the swarm.\n\nCURRENT STATE:\n${JSON.stringify(
        state,
        null,
        2
      )}`;

      if (status === "EXECUTION_FAILED") {
        const recommendations = await swarmMemory.getPatternRecommendations(state.failureReason, [
          "database-connection",
          "api-integration",
        ]);
        if (recommendations.length > 0) {
          prompt += `\n\n[Swarm Memory] Recommendations for handling failure: ${JSON.stringify(
            recommendations
          )}`;
        }
      }

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
    while (this.isEngineRunning) {
      const state = await stateManager.getState();

      // Adaptive task routing
      const nextAgent = await this.selectOptimalAgent(state);
      await this.dispatch(nextAgent, state);

      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  async dispatch(agent, state) {
    // This is a placeholder.
    // The user did not provide the implementation for this function.
    console.log(`Dispatching agent ${agent} with state ${JSON.stringify(state)}`);
  }

  async selectOptimalAgent(state) {
    // Use performance metrics to select best agent
    const metrics = await AgentPerformance.getPerformanceInsights();
    return metrics.bestAgentForTask(state.currentTaskType);
  }

  async monitorHealth() {
    const summary = await this.healthMonitor.getHealthSummary();
    console.log(
      chalk.blue(`[Health] Agents: ${summary.healthyAgents}/${summary.totalAgents} healthy.`)
    );
  }

  start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Engine Engaged ---\n"));
    this.runLoop();
    setInterval(() => this.monitorHealth(), 30000);
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

  // Enable incremental indexing
  await codeIntelligenceService.enableIncrementalIndexing(process.cwd());

  const neo4jStatus = await codeIntelligenceService.testConnection();
  const neo4jFeature = config.features?.neo4j;

  // Handle Neo4j status based on whether it's required or optional
  if (!neo4jStatus.success) {
    if (neo4jFeature === "required") {
      console.error(
        boxen(
          [
            chalk.red.bold("CRITICAL DATABASE ERROR"),
            "",
            "Engine requires Neo4j connection to function properly.",
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
            title: "System Startup",
            titleAlignment: "center",
          }
        )
      );

      // Only exit if Neo4j is required and connection fails
      process.exit(1);
    } else {
      console.log(
        boxen(
          [
            chalk.yellow.bold("Neo4j Connection Warning"),
            "",
            "Neo4j is not available, but the system can continue with limited functionality.",
            "Code intelligence features will be unavailable until connection is restored.",
            "",
            "Error: " + neo4jStatus.error,
            "",
            chalk.dim("Tip: Run 'npm run test:neo4j' to diagnose connection issues"),
          ].join("\n"),
          {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "yellow",
            title: "System Startup",
            titleAlignment: "center",
          }
        )
      );

      // Continue execution with limited functionality
    }
  } else {
    // Neo4j connection successful - check for limitations
    if (neo4jStatus.limitations && neo4jStatus.limitations.warning) {
      console.warn(
        boxen(
          [
            chalk.yellow.bold("Neo4j Limitation Notice"),
            "",
            neo4jStatus.limitations.warning,
            neo4jStatus.limitations.limitation,
            "",
            chalk.dim(neo4jStatus.limitations.recommendation),
          ].join("\n"),
          {
            padding: 1,
            margin: 1,
            borderStyle: "round",
            borderColor: "yellow",
          }
        )
      );
    }
  }

  // After Neo4j connection test
  const limitations = await codeIntelligenceService.detectNeo4jLimitations();
  if (limitations.warning) {
    console.warn(chalk.yellow(`Warning: ${limitations.warning}`));
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
