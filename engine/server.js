const express = require("express");
const stateManager = require("./state_manager");
const agentDispatcher = require("./agent_dispatcher");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor"); // Added for autonomous execution
const chalk = require("chalk");

require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEngineRunning = false;

// --- API for Supervised, Interactive Commands from IDE (e.g., Roo Code) ---
app.post("/api/interactive", async (req, res) => {
  const { agentId, prompt } = req.body;
  console.log(chalk.blue(`[API] Interactive command for '${agentId}': "${prompt}"`));

  if (isEngineRunning) {
    console.log(chalk.yellow("[API] Engine is in autonomous mode. Treating command as commentary."));
    // In a real implementation, this could be broadcast to the running agent.
    // For now, we acknowledge it but don't interrupt the main loop.
    return res.json({
      thought: "The autonomous engine is currently running. Your message has been noted as commentary.",
      action: null,
    });
  }

  try {
    const response = await llmAdapter.getCompletion(agentId, prompt);
    res.json(response);
  } catch (error) {
    console.error(chalk.red(`[API] Error for ${agentId}:`), error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- The New Autonomous Engine Core ---
async function runAutonomousAgentTask(agentId, taskPrompt) {
  console.log(chalk.magenta(`[Agent Runner] Running task for @${agentId}.`));
  let response = await llmAdapter.getCompletion(agentId, taskPrompt);

  while (response?.action?.tool) {
    console.log(
      chalk.magenta(`[Agent Runner] @${agentId} wants to use tool: ${response.action.tool}`)
    );
    try {
      const toolResult = await toolExecutor.execute(response.action.tool, response.action.args);
      const nextPrompt = `This was the result of your last action:\n${toolResult}\n\nBased on this, what is your next step?`;
      response = await llmAdapter.getCompletion(agentId, nextPrompt);
    } catch (e) {
      console.error(chalk.red(`[Agent Runner] Tool execution failed for @${agentId}`), e);
      const errorPrompt = `Your last tool call failed with this error:\n${e.message}\n\nPlease analyze the error and decide your next step. You can try again or use a different approach.`;
      response = await llmAdapter.getCompletion(agentId, errorPrompt);
    }
  }

  console.log(chalk.magenta(`[Agent Runner] Task complete for @${agentId}.`));
  return response?.thought || "Task finished.";
}

async function mainEngineLoop() {
  isEngineRunning = true;
  console.log(chalk.bold.green("\n--- Pheromind Autonomous Engine Engaged ---\n"));

  while (isEngineRunning) {
    const state = await stateManager.getState();
    console.log(chalk.cyan(`\n[Engine] New cycle started. Current status: ${state.project_status}`));

    if (state.project_status === "PROJECT_COMPLETE" || state.project_status === "EXECUTION_HALTED") {
      console.log(chalk.bold.green("Project is complete or halted. Shutting down engine loop."));
      isEngineRunning = false;
      break;
    }

    const nextAction = await agentDispatcher.getNextAction(state);

    if (nextAction.type === "WAITING") {
      console.log(chalk.gray("[Engine] " + nextAction.summary));
      await new Promise((resolve) => setTimeout(resolve, 15000)); // Wait longer if idle
      continue;
    }

    console.log(
      chalk.yellow(`[Dispatcher] Action: ${nextAction.type} | Agent: @${nextAction.agent}`)
    );
    console.log(chalk.yellow(`[Dispatcher] Summary: ${nextAction.summary}`));

    // This is the core of autonomous execution
    const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task);

    // Update state after the autonomous task is complete
    await stateManager.updateStatus(nextAction.newStatus || state.project_status);
    await stateManager.appendHistory({
      agent_id: nextAction.agent,
      signal: `DISPATCH_${nextAction.type}`,
      summary: `Completed task: ${nextAction.summary}. Agent final thought: ${taskResult}`,
    });

    console.log(chalk.cyan("[Engine] Cycle complete. Waiting 5 seconds..."));
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

function start(options = {}) {
  app.listen(PORT, async () => {
    console.log(
      chalk.bold(`[Server] Pheromind is listening on http://localhost:${PORT}`)
    );
    if (options.goal) {
      console.log(chalk.green(`[Engine] Goal received: ${options.goal}. Starting autonomous mode.`));
      // Initialize state with the goal
      await stateManager.initializeStateWithGoal(options.goal);
      mainEngineLoop();
    } else {
      console.log(chalk.gray("[Engine] No goal provided. Running in supervised API mode only."));
    }
  });
}

module.exports = { start };
