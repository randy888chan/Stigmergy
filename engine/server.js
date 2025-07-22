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
let enginePause = new Promise(resolve => resolve());
let engineResume = () => {};

async function runAutonomousAgentTask(agentId, taskPrompt, taskId = null) {
    // ... (This function remains largely the same, but we add a check for the special API key error)
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
                 return; // Exit the agent task runner
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
    console.log(chalk.yellow("[Engine] Autonomous loop is already running."));
    return;
  }
  isEngineRunning = true;
  console.log(chalk.bold.green("\n--- Stigmergy Autonomous Engine Engaged ---\n"));

  while (isEngineRunning) {
    let state = await stateManager.getState();
    console.log(chalk.cyan(`\n[Engine] New cycle. Current status: ${state.project_status}`));

    if (state.project_status === "PROJECT_COMPLETE" || state.project_status === "AWAITING_EXECUTION_APPROVAL" || state.project_status === "AWAITING_INPUT") {
      console.log(chalk.bold.yellow(`[Engine] Paused. Status: ${state.project_status}. Awaiting user action.`));
      isEngineRunning = false;
      break;
    }

    const nextAction = await agentDispatcher.getNextAction(state);
    
    if (nextAction.type === "WAITING" || nextAction.type === "IDLE") {
        console.log(chalk.gray("[Engine] " + nextAction.summary));
        await new Promise(resolve => setTimeout(resolve, 5000));
        continue;
    }

    await stateManager.updateStatusAndHistory(nextAction.newStatus, { agent_id: nextAction.agent, signal: `DISPATCH_${nextAction.type}`, summary: nextAction.summary });
    
    // Run the task
    const taskResult = await runAutonomousAgentTask(nextAction.agent, nextAction.task, nextAction.taskId);

    if (isEngineRunning) { // Re-check state in case the agent paused the engine
      await stateManager.recordTaskCompletion(nextAction, taskResult);
      console.log(chalk.cyan("[Engine] Cycle complete. Waiting 2 seconds..."));
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

// --- NEW API-DRIVEN LIFECYCLE ---

app.post("/api/system/start", async (req, res) => {
    const { goal, context } = req.body; // Roo code sends { prompt: "...", context: "..." }
    const userGoal = goal || context;
    if (!userGoal) return res.status(400).json({ error: "Project goal is required."});

    console.log(chalk.blue(`[API] Received new project request: "${userGoal}"`));
    if (isEngineRunning) return res.json({ thought: "The engine is already running a project." });

    await stateManager.initializeStateForGrandBlueprint(userGoal);
    mainEngineLoop();
    res.json({ thought: "Acknowledged. The Stigmergy engine is engaged and beginning the 'Grand Blueprint' phase. This is fully autonomous. I will notify you when the complete plan is ready for your final approval. You can monitor the terminal for detailed progress." });
});

app.post("/api/system/approve-execution", async (req, res) => {
    const state = await stateManager.getState();
    if (state.project_status !== 'AWAITING_EXECUTION_APPROVAL') {
        return res.json({ thought: "There is no execution plan awaiting approval."});
    }
    console.log(chalk.blue(`[API] Execution approved by user.`));
    await stateManager.advanceToExecution();
    mainEngineLoop();
    res.json({ thought: "Approval confirmed. Beginning autonomous execution of the plan."});
});

app.post("/api/system/provide-input", async (req, res) => {
    const { secret, key_name } = req.body;
    const state = await stateManager.getState();
    if(state.project_status !== 'AWAITING_INPUT') {
         return res.json({ thought: "System is not currently waiting for any input." });
    }
    console.log(chalk.blue(`[API] User provided required secret for ${key_name}.`));
    await stateManager.fulfillSecretRequest(key_name, secret);
    mainEngineLoop();
    res.json({ thought: `Thank you. The secret for ${key_name} has been received. Resuming autonomous operations.` });
});


app.post("/api/interactive", async (req, res) => {
  const { agentId, prompt } = req.body;
  console.log(chalk.blue(`[API] Interactive command for '${agentId}': "${prompt}"`));
  try {
    const response = await llmAdapter.getCompletion(agentId, prompt, null);
    res.json(response);
  } catch (error) {
    console.error(chalk.red(`[API] Error for ${agentId}:`), error);
    res.status(500).json({ success: false, error: error.message });
  }
});

function start() {
  app.listen(PORT, () => {
    console.log(chalk.bold(`[Server] Stigmergy Engine is listening on http://localhost:${PORT}`));
    console.log(chalk.gray("[Engine] In dormant mode. Awaiting '@system start' command from IDE..."));
  });
}

module.exports = { start };
