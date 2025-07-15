const express = require("express");
const stateManager = require("./state_manager");
const agentDispatcher = require("./agent_dispatcher");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");
const chalk = require("chalk");

require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEngineRunning = false;

// The New Autonomous Agent Runner
async function runAutonomousAgentTask(agentId, taskPrompt, taskId = null) {
  // ... (This function remains the same as the previous response)
  console.log(chalk.magenta(`[Agent Runner] Running task for @${agentId}.`));
  let response = await llmAdapter.getCompletion(agentId, taskPrompt);
  const MAX_TOOL_CALLS = 10;
  let toolCallCount = 0;

  while (response?.action?.tool && toolCallCount < MAX_TOOL_CALLS) {
    toolCallCount++;
    console.log(chalk.magenta(`[Agent Runner] @${agentId} wants to use tool: ${response.action.tool}`));
    try {
      const toolResult = await toolExecutor.execute(response.action.tool, response.action.args, agentId);
      const nextPrompt = `This was the result of your last action:\n${toolResult}\n\nBased on this, what is your next step? Continue until the task is fully complete.`;
      response = await llmAdapter.getCompletion(agentId, nextPrompt);
    } catch (e) {
      console.error(chalk.red(`[Agent Runner] Tool execution failed for @${agentId}`), e);
      if (taskId) await stateManager.incrementTaskFailure(taskId);
      const errorPrompt = `Your last tool call failed with this error:\n${e.message}\n\nPlease analyze the error and decide your next step. You can try again or use a different approach.`;
      response = await llmAdapter.getCompletion(agentId, errorPrompt);
    }
  }
  console.log(chalk.magenta(`[Agent Runner] Task complete for @${agentId}.`));
  return response?.thought || "Task finished.";
}


// The New Autonomous Engine Main Loop
async function mainEngineLoop() {
  if (isEngineRunning) {
    console.log(chalk.yellow("[Engine] Autonomous loop is already running."));
    return;
  }
  isEngineRunning = true;
  console.log(chalk.bold.green("\n--- Pheromind Autonomous Engine Engaged ---\n"));

  while (isEngineRunning) {
    const state = await stateManager.getState();
    console.log(chalk.cyan(`\n[Engine] New cycle started. Current status: ${state.project_status}`));

    if (state.project_status === "PROJECT_COMPLETE" || state.project_status === "EXECUTION_HALTED") {
      console.log(chalk.bold.green("Project is complete or halted. Engine returning to dormant state."));
      isEngineRunning = false;
      break;
    }

    const nextAction = await agentDispatcher.getNextAction(state);

    if (nextAction.type === "WAITING") {
      console.log(chalk.gray("[Engine] " + nextAction.summary));
      await new Promise((resolve) => setTimeout(resolve, 15000));
      continue;
    }

    console.log(chalk.yellow(`[Dispatcher] Action: ${nextAction.type} | Agent: @${nextAction.agent}`));
    console.log(chalk.yellow(`[Dispatcher] Summary: ${nextAction.summary}`));

    const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task, nextAction.taskId);

    // After task, update state
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


// API for all IDE interaction
app.post("/api/interactive", async (req, res) => {
  const { agentId, prompt } = req.body;
  console.log(chalk.blue(`[API] Interactive command for '${agentId}': "${prompt}"`));

  // --- AUTONOMY TRIGGER ---
  // Check if this is the special command to start the autonomous engine
  if (agentId === "dispatcher" && prompt.toLowerCase().includes("start project")) {
    if (isEngineRunning) {
      return res.json({ thought: "The autonomous engine is already running.", action: null });
    }
    await stateManager.initializeStateWithGoal(prompt);
    mainEngineLoop(); // Kick off the autonomous loop
    return res.json({ thought: "Acknowledged. The autonomous engine has been engaged. You can monitor its progress in the terminal.", action: null });
  }

  if (isEngineRunning) {
    return res.json({ thought: "Autonomous engine is running. Your message has been noted as commentary.", action: null });
  }

  // Standard supervised command
  try {
    const response = await llmAdapter.getCompletion(agentId, prompt);
    res.json(response);
  } catch (error) {
    console.error(chalk.red(`[API] Error for ${agentId}:`), error);
    res.status(500).json({ success: false, error: error.message });
  }
});


function start() {
  const enginePort = process.env.PORT || 3000;
  app.listen(enginePort, () => {
    console.log(chalk.bold(`[Server] Pheromind Engine is listening on http://localhost:${enginePort}`));
    console.log(chalk.gray("[Engine] Running in dormant supervised mode. Awaiting commands from the IDE..."));
  });
}

module.exports = { start };
