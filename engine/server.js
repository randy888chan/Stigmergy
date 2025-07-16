const express = require("express");
const fs = require('fs-extra');
const path = require('path');
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

async function runAutonomousAgentTask(agentId, taskPrompt, taskId = null) {
  console.log(chalk.magenta(`[Agent Runner] Running task for @${agentId}.`));
  let response = await llmAdapter.getCompletion(agentId, taskPrompt);
  const MAX_TOOL_CALLS = 10;
  let toolCallCount = 0;

  while (response?.action?.tool && toolCallCount < MAX_TOOL_CALLS) {
    toolCallCount++;
    console.log(chalk.magenta(`[Agent Runner] @${agentId} wants to use tool: ${response.action.tool} with args:`, response.action.args));
    try {
      const toolResult = await toolExecutor.execute(response.action.tool, response.action.args, agentId);
      const nextPrompt = `This was the result of your last action:\n${toolResult}\n\nBased on this, what is your next step? Continue until the task is fully complete.`;
      response = await llmAdapter.getCompletion(agentId, nextPrompt);
    } catch (e) {
      console.error(chalk.red(`[Agent Runner] Tool execution failed for @${agentId}: ${e.message}`));
      if (taskId) await stateManager.incrementTaskFailure(taskId);
      const toolManual = await fs.readFile(path.join(__dirname, '..', '.stigmergy-core', 'system_docs', 'Tool_Manual.md'), 'utf8');
      const errorPrompt = `Your last tool call failed with this error:\n${e.message}\n\nHere is the Tool Manual for reference:\n${toolManual}\n\nDecide your next step. You can try the tool again or use a different tool.`;
      response = await llmAdapter.getCompletion(agentId, errorPrompt);
    }
  }
  console.log(chalk.magenta(`[Agent Runner] Task complete for @${agentId}.`));
  return response?.thought || "Task finished.";
}

async function mainEngineLoop() {
  if (isEngineRunning) {
    console.log(chalk.yellow("[Engine] Autonomous loop is already running."));
    return;
  }
  isEngineRunning = true;
  console.log(chalk.bold.green("\n--- Pheromind Autonomous Engine Engaged ---\n"));

  while (isEngineRunning) {
    let state = await stateManager.getState();
    console.log(chalk.cyan(`\n[Engine] New cycle started. Current status: ${state.project_status}`));

    if (state.project_status === "PROJECT_COMPLETE" || state.project_status === "EXECUTION_HALTED") {
      console.log(chalk.bold.green("Project is complete or halted. Engine returning to dormant state."));
      isEngineRunning = false;
      break;
    }

    const nextAction = await agentDispatcher.getNextAction(state);

    if (nextAction.type === "WAITING_FOR_APPROVAL") {
      console.log(chalk.yellow(nextAction.summary));
      isEngineRunning = false; // Pause the loop
      break;
    }
    
    if (nextAction.type === "WAITING") {
        console.log(chalk.gray("[Engine] " + nextAction.summary));
        await new Promise(resolve => setTimeout(resolve, 15000));
        continue;
    }

    if (nextAction.type === "SYSTEM_TASK" && nextAction.task === "INGEST_BLUEPRINT") {
      await stateManager.ingestBlueprint(nextAction.blueprint);
      await stateManager.updateStatusAndHistory(nextAction.newStatus, { agent_id: nextAction.agent, signal: `DISPATCH_${nextAction.type}`, summary: nextAction.summary });
    } else {
      const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task, nextAction.taskId);
      await stateManager.updateStatusAndHistory(nextAction.newStatus, { agent_id: nextAction.agent, signal: `DISPATCH_${nextAction.type}`, summary: `Completed task: ${nextAction.summary}. Agent final thought: ${taskResult}` });
    }

    console.log(chalk.cyan("[Engine] Cycle complete. Waiting 5 seconds..."));
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
}

app.post("/api/interactive", async (req, res) => {
  const { agentId, prompt } = req.body;
  console.log(chalk.blue(`[API] Interactive command for '${agentId}': "${prompt}"`));

  if (agentId === "dispatcher") {
    if (prompt.toLowerCase().includes("start project")) {
      if (isEngineRunning) return res.json({ thought: "The autonomous engine is already running." });
      await stateManager.initializeStateWithGoal(prompt);
      mainEngineLoop();
      return res.json({ thought: "Acknowledged. Autonomous engine engaged. Monitor terminal for progress." });
    }
    if (prompt.toLowerCase().includes("*approve")) {
      const state = await stateManager.getState();
      if (state.project_status.startsWith("AWAITING_APPROVAL")) {
        const newStatus = await stateManager.advanceApprovalState();
        mainEngineLoop();
        return res.json({ thought: `Approved. Advancing project to ${newStatus}.` });
      } else {
        return res.json({ thought: "There is nothing currently awaiting approval." });
      }
    }
  }

  if (isEngineRunning) return res.json({ thought: "Autonomous engine is running. Message noted as commentary." });

  try {
    const response = await llmAdapter.getCompletion(agentId, prompt);
    res.json(response);
  } catch (error) {
    console.error(chalk.red(`[API] Error for ${agentId}:`), error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function start() {
  app.listen(process.env.PORT || 3000, () => {
    console.log(chalk.bold(`[Server] Pheromind Engine is listening on http://localhost:${process.env.PORT || 3000}`));
    console.log(chalk.gray("[Engine] In dormant mode. Awaiting command from IDE..."));
  });
}

module.exports = { start };
