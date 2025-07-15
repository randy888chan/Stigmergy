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

// API for Supervised, Interactive Commands from IDE (e.g., Roo Code)
app.post("/api/interactive", async (req, res) => {
  const { agentId, prompt } = req.body;
  console.log(chalk.blue(`[API] Interactive command for '${agentId}': "${prompt}"`));

  if (isEngineRunning) {
    console.log(chalk.yellow("[API] Engine is in autonomous mode. Treating command as commentary."));
    return res.json({ thought: "Autonomous engine is running. Message noted as commentary.", action: null });
  }

  try {
    const response = await llmAdapter.getCompletion(agentId, prompt);
    res.json(response);
  } catch (error) {
    console.error(chalk.red(`[API] Error for ${agentId}:`), error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// The New Autonomous Agent Runner
async function runAutonomousAgentTask(agentId, taskPrompt, taskId = null) {
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
      
      const toolManual = require('fs').readFileSync(require('path').join(__dirname, '..', '.stigmergy-core', 'system_docs', 'Tool_Manual.md'), 'utf8');
      const errorPrompt = `Your last tool call failed with this error:\n${e.message}\n\nPlease analyze the error. Here is the Tool Manual for reference:\n${toolManual}\n\nDecide your next step. You can try the tool again with different arguments, or use a different tool to solve the problem.`;
      response = await llmAdapter.getCompletion(agentId, errorPrompt);
    }
  }

  console.log(chalk.magenta(`[Agent Runner] Task complete for @${agentId}.`));
  return response?.thought || "Task finished.";
}

// The New Autonomous Engine Main Loop
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
      await new Promise((resolve) => setTimeout(resolve, 15000));
      continue;
    }

    console.log(chalk.yellow(`[Dispatcher] Action: ${nextAction.type} | Agent: @${nextAction.agent}`));
    console.log(chalk.yellow(`[Dispatcher] Summary: ${nextAction.summary}`));

    const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task, nextAction.taskId);

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
  const enginePort = process.env.PORT || 3000;
  app.listen(enginePort, async () => {
    console.log(chalk.bold(`[Server] Pheromind is listening on http://localhost:${enginePort}`));
    if (options.goal) {
      console.log(chalk.green(`[Engine] Goal received: ${options.goal}. Starting autonomous mode.`));
      await stateManager.initializeStateWithGoal(options.goal);
      mainEngineLoop();
    } else {
      console.log(chalk.gray("[Engine] No goal provided. Running in supervised API mode only."));
    }
  });
}

module.exports = { start };
