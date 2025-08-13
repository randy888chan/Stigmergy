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
import AgentPerformance from "./agent_performance.js";
import swarmMemory from "./swarm_memory.js";
import coreBackup from "../services/core_backup.js";
import { StatefulGraph, END } from "@langchain/langgraph";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

/**
 * Defines the state of the agent graph.
 * @typedef {Object} AgentState
 * @property {Object} state - The overall project state from stateManager.
 * @property {string|null} next_agent - The ID of the agent to be executed next.
 * @property {string|null} prompt - The prompt for the next agent.
 * @property {any} last_result - The result from the previously executed node.
 * @property {string[]} agent_history - A list of agents that have run.
 * @property {number} recursion_level - The number of times the graph has looped.
 */
export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.healthMonitor = new LightweightHealthMonitor();
    this.graph = this.setupGraph(); // New: setup graph
    this.setupRoutes();
  }

  // New method to setup the graph
  setupGraph() {
    const agentState = {
      state: { value: null },
      next_agent: { value: null },
      prompt: { value: null },
      last_result: { value: null },
      agent_history: { value: [], default: () => [] },
      recursion_level: { value: 0, default: () => 0 },
    };

    const workflow = new StatefulGraph({
      channels: agentState,
    });

    // Node to get the current state
    const getStateNode = async (state) => {
      const currentState = await stateManager.getState();
      const autonomous_states = [
        "GRAND_BLUEPRINT_PHASE",
        "EXECUTION_IN_PROGRESS",
        "EXECUTION_FAILED",
      ];
      if (!autonomous_states.includes(currentState.project_status)) {
        console.log(
          chalk.gray(
            `[Engine] No autonomous action required for status: ${currentState.project_status}. Ending graph.`
          )
        );
        return { state: { end_run: true } };
      }
      return {
        state: currentState,
        agent_history: [...state.agent_history, "getState"],
        recursion_level: state.recursion_level + 1,
      };
    };

    // Node for the dispatcher agent
    const dispatcherNode = async (state) => {
      const currentState = state.state;
      console.log(chalk.blue("[Engine] Dispatching @dispatcher to determine next action."));
      let prompt = `System state has been updated. Analyze the current state and determine the next single, most logical action for the swarm. The output should be a JSON object with "next_agent" and "prompt" keys. Example: { "next_agent": "dev", "prompt": "Implement the new feature as described." }. If no further action is needed, return an empty JSON object {}.\n\nCURRENT STATE:\n${JSON.stringify(
        currentState,
        null,
        2
      )}`;

      if (currentState.project_status === "EXECUTION_FAILED") {
        const recommendations = await swarmMemory.getPatternRecommendations(currentState.failureReason, [
          "database-connection",
          "api-integration",
        ]);
        if (recommendations.length > 0) {
          prompt += `\n\n[Swarm Memory] Recommendations for handling failure: ${JSON.stringify(
            recommendations
          )}`;
        }
      }

      const result = await this.triggerAgent("dispatcher", prompt);

      let next_agent = null;
      let next_prompt = null;
      try {
          const parsedResult = JSON.parse(result.replace(/```json\n?/, "").replace(/```/, ""));
          next_agent = parsedResult.next_agent;
          next_prompt = parsedResult.prompt;
      } catch (e) {
          console.log(chalk.yellow("[Dispatcher] Could not parse JSON from dispatcher output. Looping back."));
      }

      return { last_result: result, next_agent: next_agent, prompt: next_prompt, agent_history: [...state.agent_history, "dispatcher"] };
    };

    // Generic agent execution node
    const agentNode = async (state) => {
      const { next_agent, prompt } = state;
      if (!next_agent) {
        console.log(chalk.yellow("[Agent Node] No next agent defined. Returning to dispatcher."));
        return { next_agent: null, prompt: null };
      }
      console.log(chalk.green(`[Engine] Triggering @${next_agent}.`));
      const result = await this.triggerAgent(next_agent, prompt);
      return { last_result: result, next_agent: null, prompt: null, agent_history: [...state.agent_history, next_agent] };
    };

    workflow.addNode("getState", getStateNode.bind(this));
    workflow.addNode("dispatcher", dispatcherNode.bind(this));
    workflow.addNode("agent", agentNode.bind(this));

    // Conditional edge logic
    const conditionalEdge = (state) => {
      if (state.recursion_level > 10) { // Circuit breaker
        console.log(chalk.red("[Engine] Recursion limit reached. Stopping graph."));
        return END;
      }
      if (state.next_agent) {
          return "agent";
      }
      return "getState";
    };

    workflow.setEntryPoint("getState");
    workflow.addConditionalEdges("getState", (state) => {
      if (state.state?.end_run) return END;
      return "dispatcher";
    });
    workflow.addConditionalEdges("dispatcher", conditionalEdge, {
        "agent": "agent",
        "getState": "getState",
        [END]: END
    });
    workflow.addEdge("agent", "getState"); // After an agent runs, always re-evaluate state.

    return workflow.compile();
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

  async monitorHealth() {
    const summary = await this.healthMonitor.getHealthSummary();
    console.log(
      chalk.blue(`[Health] Agents: ${summary.healthyAgents}/${summary.totalAgents} healthy.`)
    );
  }

  async start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Engine Engaged (LangGraph Mode) ---\n"));

    // This is an async generator, so we need to iterate over it.
    const run = async () => {
      for await (const event of await this.graph.stream({ recursion_level: 0 })) {
        if (!this.isEngineRunning) {
          console.log(chalk.yellow("[Engine] Stop signal received. Halting graph execution."));
          break;
        }
        // console.log(event); // Uncomment for detailed graph logging
      }
      if (this.isEngineRunning) {
        console.log(chalk.bold.green("\n--- Stigmergy Graph Execution Finished ---\n"));
        this.isEngineRunning = false;
      }
    };

    run(); // Run the graph in the background
    setInterval(() => this.monitorHealth(), 30000);
  }

  async stop(reason) {
    if (!this.isEngineRunning) return;
    this.isEngineRunning = false; // This will stop the graph stream loop
    console.log(chalk.bold.red(`\n--- Stigmergy Engine Disengaged (Reason: ${reason}) ---\n`));
  }
}

export async function main() {
  try {
    await coreBackup.autoBackup();
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
  } catch (error) {
    await coreBackup.restoreLatest();
    process.exit(1);
  }
}

// Only run main when this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(console.error);
}
