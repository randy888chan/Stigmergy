// engine/server.js
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
import { LightweightHealthMonitor } from "../src/monitoring/lightweightHealthMonitor.js";
import { StateGraph, END, interrupt } from "@langchain/langgraph";
import { createPlanningGraph } from "./planning_graph.js";
import { createExecutionGraph } from "./execution_graph.js";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);
const pkg = JSON.parse(readFileSync(path.resolve(currentDirPath, "../package.json")));

const REVIEW_FREQUENCY = 5; // Configurable number for periodic review

const supervisorState = {
  goal: { value: (x, y) => y, default: () => "" },
  user_feedback: { value: (x, y) => y, default: () => "" },
  architecture_plan: { value: (x, y) => y, default: () => null },
  tasks: { value: (x, y) => y, default: () => [] },
  last_result: { value: (x, y) => y, default: () => null },
  context_package: { value: (x, y) => y, default: () => "" },
  // Add last_error to state for self-correction
  last_error: { value: (x, y) => y, default: () => null },
  decision: { value: (x, y) => y, default: () => null },
  tasks_completed: { value: (x, y) => (x ?? 0) + y, default: () => 0 },
};

// Add a constant for the self-improvement cycle
const SELF_IMPROVEMENT_CYCLE = 10; // Trigger @metis after every 10 tasks.

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.healthMonitor = new LightweightHealthMonitor();
    this.graph = null;
    this.planningGraph = null;
    this.executionGraph = null;
    this.taskCounter = 0; // --- ADDITION ---
  }

  // --- START: NEW MAIN LOOP IMPLEMENTATION ---
  async start() {
      if (this.isEngineRunning) {
          console.log(chalk.yellow("Engine is already running."));
          return;
      }
      console.log(chalk.green("🚀 Stigmergy Engine starting..."));
      this.isEngineRunning = true;
      this.runMainLoop(); // Kick off the loop
  }

  async stop(reason = "Stopped by internal command.") {
      if (!this.isEngineRunning) {
          console.log(chalk.yellow("Engine is not running."));
          return;
      }
      console.log(chalk.red(`🛑 Stigmergy Engine stopping. Reason: ${reason}`));
      this.isEngineRunning = false;
  }

  async runMainLoop() {
    while (this.isEngineRunning) {
      try {
        const state = await stateManager.getState();
        console.log(chalk.blue(`[Engine Loop] Current Status: ${state.project_status}`));

        // SELF-IMPROVEMENT TRIGGER
        if (this.taskCounter >= SELF_IMPROVEMENT_CYCLE) {
            console.log(chalk.magentaBright("[Engine Loop] Self-improvement cycle triggered. Handing off to @metis..."));
            await stateManager.updateStatus({ newStatus: 'NEEDS_IMPROVEMENT' });
            this.taskCounter = 0; // Reset counter
            continue; // Re-run the loop with the new status
        }

        // Pass the entire state to the dispatcher (@saul) to get the next action
        const decision = await this.triggerAgent("dispatcher", state);

        if (decision && decision.action && decision.action.tool) {
            console.log(chalk.cyan(`[Engine Loop] Dispatcher Action: ${decision.action.tool}`));
            console.log(chalk.cyan(`[Engine Loop] Args: ${JSON.stringify(decision.action.args)}`));

            // The dispatcher's primary tool is 'stigmergy.task', which calls this.triggerAgent
            await this.executeTool(decision.action.tool, decision.action.args, 'dispatcher');
            this.taskCounter++; // Increment task counter on successful action
        } else {
            console.log(chalk.yellow("[Engine Loop] Dispatcher returned no action. System is idle. Pausing for 10s."));
            await new Promise(resolve => setTimeout(resolve, 10000));
        }

      } catch (error) {
          console.error(chalk.redBright("[Engine Loop] A critical error occurred in the main loop:"), error);
          this.stop("Critical error.");
      }
    }
  }

  async triggerAgent(agentId, prompt) {
      console.log(`[Engine] Triggering agent: @${agentId}`);
      // This is where you would call your LLM adapter
      // For now, we simulate the response structure for the dispatcher
      if (agentId === 'dispatcher') {
          // In a real system, the LLM would generate this based on the state (prompt)
          // Here we simulate the logic from @saul's new protocol
          const state = prompt; // The prompt for the dispatcher *is* the state
          if (state.project_status === 'NEEDS_IMPROVEMENT') {
              return {
                  thought: "The engine has triggered a self-improvement cycle. I must task @metis to analyze system patterns.",
                  action: {
                      tool: "stigmergy.task",
                      args: {
                          subagent_type: "metis",
                          description: "Analyze system failure patterns using `swarm_intelligence.get_failure_patterns` and propose a corrective action."
                      }
                  }
              }
          }
          // Add more simulated logic for other states here...
          return { thought: "Simulating dispatcher logic. No action taken in this test.", action: null };
      }
      // For other agents, this would be a direct LLM call
      return `Result from @${agentId}`;
  }
  // --- END: NEW MAIN LOOP IMPLEMENTATION ---
}

async function main() {
  const engine = new Engine();
  await engine.start();
}

// Ensure this runs only when the script is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(chalk.redBright("A fatal error occurred during engine startup:"), error);
    process.exit(1);
  });
}
