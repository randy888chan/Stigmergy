const express = require("express");
const stateManager = require("./state_manager");
// const agentDispatcher = require("./agent_dispatcher"); // DELETED: This is now obsolete.
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");
const chalk = require("chalk");

require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEngineRunning = false;

async function runAutonomousAgentTask(agentId, taskPrompt, taskId = null) {
    // This function is unchanged from the previous correct implementation
    console.log(chalk.magenta(`[Agent Runner] Running task for @${agentId}.`));
    let response = await llmAdapter.getCompletion(agentId, taskPrompt, taskId);
    const MAX_TOOL_CALLS = 10;
    let toolCallCount = 0;

    while (response?.action?.tool && toolCallCount < MAX_TOOL_CALLS) {
        toolCallCount++;
        try {
            console.log(chalk.magenta(`[Agent Runner] @${agentId} wants to use tool: ${response.action.tool} with args:`, response.action.args));
            const toolResult = await toolExecutor.execute(response.action.tool, response.action.args, agentId);
            const nextPrompt = `This was the result of your last action:\n${toolResult}\n\nBased on this, what is your next step? Continue until the task is fully complete.`;
            response = await llmAdapter.getCompletion(agentId, nextPrompt, taskId);
        } catch (e) {
            console.error(chalk.red(`[Agent Runner] Tool execution failed for @${agentId}: ${e.message}`));
            if (e.name === 'MissingApiKeyError' || e.name === 'MissingSecretError') {
                 console.log(chalk.yellow(`[Engine] Pausing for user input: ${e.message}`));
                 await stateManager.updateStatusAndHistory("AWAITING_INPUT", { agent_id: 'system', signal: 'INPUT_REQUIRED', summary: e.message });
                 isEngineRunning = false;
                 return;
            }
            if (taskId) await stateManager.incrementTaskFailure(taskId);
            const errorPrompt = `Your last tool call failed with this error:\n${e.message}\n\nDecide your next step. You can try the tool again or use a different tool.`;
            response = await llmAdapter.getCompletion(agentId, errorPrompt, taskId);
        }
    }
    console.log(chalk.magenta(`[Agent Runner] Task complete for @${agentId}.`));
    return response?.thought || "Task finished.";
}


async function mainEngineLoop() {
  if (isEngineRunning) {
    console.log(chalk.yellow("[Engine] Loop is already running."));
    return;
  }
  isEngineRunning = true;
  console.log(chalk.bold.green("\n--- Stigmergy Autonomous Engine v1.1 Engaged ---\n"));

  while (isEngineRunning) {
    const state = await stateManager.getState();
    console.log(chalk.cyan(`\n[Engine] New cycle. Current status: ${state.project_status}`));

    if (["PROJECT_COMPLETE", "AWAITING_EXECUTION_APPROVAL", "AWAITING_INPUT"].includes(state.project_status)) {
      console.log(chalk.bold.yellow(`[Engine] Paused. Status: ${state.project_status}. Awaiting user action.`));
      isEngineRunning = false;
      break;
    }

    // --- MODIFIED: AI-DRIVEN DISPATCH ---
    try {
        const dispatchPrompt = `Given the complete project state below, determine the single next action the system must take. Your response MUST include an 'action' object defining the 'agent' to call and the 'task' to assign them.
        State: ${JSON.stringify(state, null, 2)}`;

        const dispatcherResponse = await llmAdapter.getCompletion('dispatcher', dispatchPrompt, null);
        const nextAction = dispatcherResponse.action; // The AI's decision is now the action

        if (!nextAction || !nextAction.agent || !nextAction.task) {
             console.log(chalk.yellow("[Engine] Dispatcher did not determine a next action. Idling..."));
             await new Promise(resolve => setTimeout(resolve, 15000));
             continue;
        }

        console.log(chalk.blue(`[AI Dispatcher] Chose agent '@${nextAction.agent}' for task: "${nextAction.task.substring(0, 80)}..."`));
        
        const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task, nextAction.taskId);

        if (isEngineRunning) {
            await stateManager.recordTaskCompletion(nextAction, taskResult);
            console.log(chalk.cyan("[Engine] Cycle complete. Waiting 2 seconds..."));
            await new Promise((resolve) => setTimeout(resolve, 2000));
        }

    } catch (error) {
        console.error(chalk.red.bold("[Engine] Critical error in main loop:"), error);
        isEngineRunning = false;
        await stateManager.updateStatusAndHistory('EXECUTION_HALTED', { agent_id: 'system', signal: 'CRITICAL_ERROR', summary: error.message });
    }
  }
}

// API routes are confirmed to be correct for the v1.1 workflow and are unchanged.
app.post("/api/system/start", async (req, res) => { /* ... */ });
app.post("/api/system/approve-execution", async (req, res) => { /* ... */ });
app.post("/api/system/provide-input", async (req, res) => { /* ... */ });
app.post("/api/interactive", async (req, res) => { /* ... */ });

function start() {
  app.listen(PORT, () => {
    console.log(chalk.bold(`[Server] Stigmergy Engine v1.1 is listening on http://localhost:${PORT}`));
    console.log(chalk.gray("[Engine] In dormant mode. Awaiting '@system start' command from IDE..."));
  });
}

module.exports = { start };
