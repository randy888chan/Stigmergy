const express = require("express");
const chalk = require("chalk");
const stateManager = require("./state_manager");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");
const config = require("../stigmergy.config.js");

require("dotenv").config();

// Placeholder for a proper MCP Server implementation
// In a real scenario, you would use a library like '@mcp/server'
class McpServer {
  constructor(handler) {
    this.handler = handler;
  }
  listen(port, callback) {
    this.handler.listen(port, callback);
  }
}

class Engine {
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
      res.json({ message: "Project initiated. Autonomous planning has begun." });
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

  async dispatchAgentForState(state) {
    const status = state.project_status;
    console.log(chalk.cyan(`[Engine] Current Status: ${status}`));

    let agentId = null;
    let taskId = null;

    switch (status) {
      case 'GRAND_BLUEPRINT_PHASE':
        // This phase is a sequence of agents. We determine the next one.
        if (!state.artifacts_created.brief) agentId = 'analyst';
        else if (!state.artifacts_created.prd) agentId = 'pm';
        else if (!state.artifacts_created.architecture) agentId = 'design-architect';
        else {
          // All planning artifacts are done, move to approval.
          await stateManager.updateStatus("AWAITING_EXECUTION_APPROVAL", "Grand Blueprint complete. Awaiting user approval.");
          return;
        }
        break;
      
      case 'EXECUTION_IN_PROGRESS':
        const nextTask = state.project_manifest.tasks.find(t => t.status === "PENDING");
        if (!nextTask) {
          await stateManager.updateStatus("PROJECT_COMPLETE", "All tasks completed.");
          return;
        }
        agentId = config.executor_preference === 'gemini' ? 'gemini-executor' : 'dev';
        taskId = nextTask.id;
        await stateManager.updateTaskStatus(taskId, "IN_PROGRESS");
        break;

      case 'AWAITING_QA':
        agentId = 'qa';
        taskId = state.project_manifest.tasks.find(t => t.status === "AWAITING_QA")?.id;
        break;

      case 'PROJECT_COMPLETE':
        console.log(chalk.bold.green("[Engine] Project is complete. Triggering self-improvement audit."));
        agentId = 'meta';
        break;

      default:
        console.log(chalk.yellow(`[Engine] Paused in status: ${status}. Awaiting user action or state change.`));
        await this.stop(`Paused in state: ${status}`);
        return;
    }

    if (agentId) {
      console.log(chalk.blue(`[Engine] Dispatching to @${agentId}` + (taskId ? ` for task ${taskId}` : '')));
      const response = await llmAdapter.getCompletion(agentId, "Proceed with your core protocol based on the current system state.", taskId);

      if (response.action?.tool) {
        console.log(chalk.magenta(`[Engine] Agent @${agentId} is calling tool: ${response.action.tool}`));
        await toolExecutor.execute(response.action.tool, response.action.args, agentId);
      }
    }
  }

  async runLoop() {
    if (!this.isEngineRunning) return;

    try {
      const state = await stateManager.getState();
      await this.dispatchAgentForState(state);
    } catch (error) {
      console.error(chalk.red('[Engine] Error in main loop:'), error);
      await this.stop('Error occurred');
    }
    
    if (this.isEngineRunning) {
      this.engineLoopHandle = setTimeout(() => this.runLoop(), 5000);
    }
  }

  start() {
    if (this.isEngineRunning) return;
    this.isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Autonomous Engine Engaged ---\n"));
    this.runLoop();
  }

  async stop(reason) {
    if (!this.isEngineRunning) return;
    console.log(chalk.bold.red(`\n--- Stigmergy Autonomous Engine Disengaged (Reason: ${reason}) ---\n`));
    this.isEngineRunning = false;
    if (this.engineLoopHandle) {
      clearTimeout(this.engineLoopHandle);
      this.engineLoopHandle = null;
    }
  }

  listen(port, callback) {
    this.app.listen(port, callback);
  }
}

function main() {
    const engine = new Engine();
    const mcpServer = new McpServer(engine); // Wrap the engine for MCP
    const PORT = process.env.PORT || 3000;

    mcpServer.listen(PORT, async () => {
        console.log(chalk.bold(`[Server] Stigmergy Engine is listening on http://localhost:${PORT}`));
        try {
            const state = await stateManager.getState();
            if (['GRAND_BLUEPRINT_PHASE', 'EXECUTION_IN_PROGRESS', 'AWAITING_QA'].includes(state.project_status)) {
                console.log(chalk.bold.yellow(`[Engine] Resuming project '${state.project_name}' from status: ${state.project_status}`));
                engine.start();
            } else {
                console.log(chalk.gray("[Engine] In dormant mode. Awaiting IDE command..."));
            }
        } catch (e) {
            console.error(chalk.red("Failed to initialize state."), e);
        }
    });
}

if (require.main === module) {
  main();
}
