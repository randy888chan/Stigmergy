import express from "express";
import chalk from "chalk";
import * as stateManager from "./state_manager.js";
import { createExecutor } from "./tool_executor.js";
import "dotenv/config.js";
import { fileURLToPath } from 'url';

const SELF_IMPROVEMENT_CYCLE = 10;

export class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.app = express();
    this.app.use(express.json());
    this.stateManager = stateManager;
    this.executeTool = createExecutor(this);
    this.taskCounter = 0;
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.post('/api/chat', async (req, res) => {
        try {
            const { agentId, prompt } = req.body;
            console.log(chalk.green(`[API] Received request for @${agentId}`));
            // In a real system, you would have a more complex interaction model.
            // For now, we'll just trigger the agent and return a simple response.
            const result = await this.triggerAgent(agentId, prompt);
            res.json({ response: result });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    });
  }

  async initialize() {
    console.log("[Engine] Initializing services...");
    // Future async initializations (like DB connection tests) go here.
    return true;
  }

  async start() {
    const PORT = process.env.PORT || 3000;
    this.app.listen(PORT, () => {
        console.log(chalk.green(`🚀 Stigmergy Engine server is running on http://localhost:${PORT}`));
        if (!this.isEngineRunning) {
            this.isEngineRunning = true;
            this.runMainLoop();
        }
    });
  }

  async stop(reason = "Stopped by command.") {
    this.isEngineRunning = false;
    console.log(chalk.red(`🛑 Stigmergy Engine stopped. Reason: ${reason}`));
  }

  async runMainLoop() {
    if (!this.isEngineRunning) return;

    try {
      const state = await stateManager.getState();
      console.log(chalk.blue(`[Engine Loop] Status: ${state.project_status}`));

      if (this.taskCounter >= SELF_IMPROVEMENT_CYCLE) {
        console.log(chalk.magentaBright("[Engine Loop] Self-improvement cycle triggered."));
        await stateManager.updateStatus({ newStatus: "NEEDS_IMPROVEMENT" });
        this.taskCounter = 0;
      } else {
        const decision = await this.triggerAgent("dispatcher", state);

        if (decision?.action?.tool) {
          await this.executeTool(decision.action.tool, decision.action.args, "dispatcher");
          this.taskCounter++;
        } else {
          console.log(chalk.yellow("[Engine Loop] Idle. No action taken."));
        }
      }
    } catch (error) {
      console.error(chalk.redBright("[Engine Loop] Critical error:"), error);
      this.stop("Critical error.");
    } finally {
      if (this.isEngineRunning) {
        this.timerId = setTimeout(() => this.runMainLoop(), 100); // Loop every 100ms
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

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const engine = new Engine();
    engine.initialize().then(success => {
        if (success) engine.start();
    });
}
