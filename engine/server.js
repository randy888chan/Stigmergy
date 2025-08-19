// engine/server.js
import express from "express";
import chalk from "chalk";
import * as stateManager from "./state_manager.js";
import { createExecutor } from "./tool_executor.js";
import "dotenv/config.js";

const SELF_IMPROVEMENT_CYCLE = 10;

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.executeTool = createExecutor(this);
    this.taskCounter = 0;
  }

  async initialize() {
    console.log("[Engine] Initializing services...");
    // Future async initializations (like DB connection tests) go here.
    return true;
  }

  async start() {
    if (this.isEngineRunning) return;
    console.log(chalk.green("🚀 Stigmergy Engine starting..."));
    this.isEngineRunning = true;
    this.runMainLoop();
  }

  async stop(reason = "Stopped by command.") {
    if (!this.isEngineRunning) return;
    console.log(chalk.red(`🛑 Stigmergy Engine stopping. Reason: ${reason}`));
    this.isEngineRunning = false;
  }

  async runMainLoop() {
    while (this.isEngineRunning) {
      try {
        const state = await stateManager.getState();
        console.log(chalk.blue(`[Engine Loop] Status: ${state.project_status}`));

        if (this.taskCounter >= SELF_IMPROVEMENT_CYCLE) {
          console.log(chalk.magentaBright("[Engine Loop] Self-improvement cycle triggered."));
          await stateManager.updateStatus({ newStatus: "NEEDS_IMPROVEMENT" });
          this.taskCounter = 0;
          continue;
        }

        const decision = await this.triggerAgent("dispatcher", state);

        if (decision?.action?.tool) {
          await this.executeTool(decision.action.tool, decision.action.args, "dispatcher");
          this.taskCounter++;
        } else {
          console.log(chalk.yellow("[Engine Loop] Idle. Pausing for 10s."));
          await new Promise((resolve) => setTimeout(resolve, 10000));
        }
      } catch (error) {
        console.error(chalk.redBright("[Engine Loop] Critical error:"), error);
        this.stop("Critical error.");
      }
    }
  }

  async triggerAgent(agentId, prompt) {
    // This is the central point for LLM calls.
    // It would be updated to use the tiered model logic.
    console.log(`[Engine] Triggering agent: @${agentId}`);
    // Simulated logic for dispatcher
    if (agentId === "dispatcher") {
      const state = prompt;
      if (state.project_status === "NEEDS_IMPROVEMENT") {
        return {
          thought: "System needs improvement. Tasking @metis.",
          action: {
            tool: "stigmergy.task",
            args: {
              subagent_type: "metis",
              description: "Analyze failure patterns and propose a fix.",
            },
          },
        };
      }
      return { thought: "Simulating idle state.", action: null };
    }
    return `Result from @${agentId}`;
  }
}
