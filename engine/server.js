const express = require("express");
const chalk = require("chalk");
const { McpServer, StdioServerTransport } = require('@mcp/server'); // Using a real MCP server library
const stateManager = require("./state_manager");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");
const config = require("../stigmergy.config.js");

require("dotenv").config();

class Engine {
  constructor() {
    this.isEngineRunning = false;
    this.engineLoopHandle = null;
  }

  // A new method to allow external triggers (from MCP)
  async triggerAgent(agentId, prompt, taskId = null) {
    console.log(chalk.blue(`[Engine] MCP triggered agent @${agentId}` + (taskId ? ` for task ${taskId}` : '')));
    const response = await llmAdapter.getCompletion(agentId, prompt, taskId);

    if (response.action?.tool) {
      console.log(chalk.magenta(`[Engine] Agent @${agentId} is calling tool: ${response.action.tool}`));
      const toolResult = await toolExecutor.execute(response.action.tool, response.action.args, agentId);
      // In a real MCP implementation, this result would be sent back to the client.
      return toolResult;
    }
    return response.thought;
  }

  async dispatchAgentForState(state) {
    // ... (This entire function remains the same as the previous response)
    const status = state.project_status;
    console.log(chalk.cyan(`[Engine] Current Status: ${status}`));

    let agentId = null;
    let taskId = null;

    switch (status) {
      case 'GRAND_BLUEPRINT_PHASE':
        if (!state.artifacts_created.brief) agentId = 'analyst';
        else if (!state.artifacts_created.prd) agentId = 'pm';
        else if (!state.artifacts_created.architecture) agentId = 'design-architect';
        else {
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
        await this.triggerAgent(agentId, "Proceed with your core protocol based on the current system state.", taskId);
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
}

function main() {
    const engine = new Engine();
    const app = express();
    app.use(express.json());
    
    // Initialize the MCP Server
    const mcpServer = new McpServer({
        name: 'stigmergy-engine',
        version: '2.0.0',
    });

    // Define MCP tools that map to our engine's agents
    mcpServer.tool('start_project', { goal: 'string' }, async ({ goal }) => {
        await stateManager.initializeProject(goal);
        engine.start();
        return { content: [{ type: 'text', text: `Project initiated with goal: "${goal}". Autonomous planning has begun.` }] };
    });

    mcpServer.tool('design_ui', { prompt: 'string' }, async ({ prompt }) => {
        const result = await engine.triggerAgent('design', prompt);
        return { content: [{ type: 'text', text: result }] };
    });

    mcpServer.tool('approve_execution', {}, async () => {
        await stateManager.updateStatus("EXECUTION_IN_PROGRESS", "Execution approved by user.");
        engine.start(); // Re-engage the engine
        return { content: [{ type: 'text', text: "Execution approved. The engine will now proceed." }] };
    });

    // Stdio transport for IDE integration
    const transport = new StdioServerTransport();
    mcpServer.connect(transport);
    console.log(chalk.bold('[MCP Server] Stigmergy Engine is running in STDIO mode for IDE integration.'));

    // We can also run an HTTP server for web UI or other clients if needed in the future
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        console.log(chalk.bold(`[Server] Stigmergy status API listening on http://localhost:${PORT}`));
        
        // Auto-resume logic
        const state = await stateManager.getState();
        if (['GRAND_BLUEPRINT_PHASE', 'EXECUTION_IN_PROGRESS', 'AWAITING_QA'].includes(state.project_status)) {
            console.log(chalk.bold.yellow(`[Engine] Resuming project '${state.project_name}' from status: ${state.project_status}`));
            engine.start();
        } else {
            console.log(chalk.gray("[Engine] In dormant mode. Awaiting IDE/MCP command..."));
        }
    });
}

if (require.main === module) {
  main();
}
