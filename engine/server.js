const express = require("express");
const chalk = require("chalk");
const path = require("path");
const { spawn } = require("child_process");
const stateManager = require("./state_manager");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");
const config = require("../stigmergy.config.js");

require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEngineRunning = false;
let engineLoopHandle = null;

// --- STATE HANDLERS ---

async function handleGrandBlueprintPhase(state) {
  console.log(chalk.blue("[Engine] Executing Grand Blueprint Phase..."));
  // This would dispatch a sequence of planner agents (@analyst, @pm, @design-architect).
  // For now, we simulate the planning and transition the state.
  await new Promise(resolve => setTimeout(resolve, 5000));
  await stateManager.updateStatus("AWAITING_EXECUTION_APPROVAL", "Grand Blueprint complete. Awaiting user approval.");
}

async function handleExecutionInProgress(state) {
  console.log(chalk.blue("[Engine] Executing next task..."));
  const nextTask = state.project_manifest.tasks.find(t => t.status === "PENDING");

  if (!nextTask) {
    await stateManager.updateStatus("PROJECT_COMPLETE", "All tasks in the manifest have been completed.");
    return;
  }

  console.log(chalk.cyan(`[Engine] Starting task: ${nextTask.id} - ${nextTask.summary}`));
  await stateManager.updateTaskStatus(nextTask.id, "IN_PROGRESS");

  try {
    const executorAgent = config.executor_preference === 'gemini' ? 'gemini-executor' : 'dev';
    console.log(`[Engine] Dispatching to executor: @${executorAgent}`);
    
    // Simulate agent execution. A real implementation would use the llm_adapter.
    await new Promise(resolve => setTimeout(resolve, 8000));
    
    await stateManager.updateTaskStatus(nextTask.id, "AWAITING_QA");
  } catch (error) {
    console.error(chalk.red(`[Engine] Task ${nextTask.id} failed:`), error);
    await stateManager.recordTaskFailure(nextTask.id);
  }
}

async function handleAwaitingQA(state) {
    console.log(chalk.magenta("[Engine] Verifying last task..."));
    const taskToVerify = state.project_manifest.tasks.find(t => t.status === "AWAITING_QA");
    if (!taskToVerify) return; // Should not happen

    // In a real system, the @qa agent would run tests here.
    // We'll simulate a successful verification.
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await stateManager.updateTaskStatus(taskToVerify.id, "COMPLETED");
    console.log(chalk.green(`[Engine] Task ${taskToVerify.id} passed QA.`));
}

async function handleProjectComplete(state) {
    console.log(chalk.bold.green("[Engine] Project is complete. Triggering self-improvement audit."));
    // TODO: Trigger @metis agent via a non-blocking worker thread.
    await stopEngineLoop("Project Complete");
}

const stateHandlers = {
    'GRAND_BLUEPRINT_PHASE': handleGrandBlueprintPhase,
    'EXECUTION_IN_PROGRESS': handleExecutionInProgress,
    'AWAITING_QA': handleAwaitingQA,
    'PROJECT_COMPLETE': handleProjectComplete,
};

// --- CORE ENGINE LOOP ---

async function mainEngineLoop() {
    if (isEngineRunning) return;
    isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Autonomous Engine Engaged ---\n"));

    const loop = async () => {
        if (!isEngineRunning) return;

        const state = await stateManager.getState();
        console.log(chalk.cyan(`[Engine] New cycle. Status: ${state.project_status}`));
        
        const handler = stateHandlers[state.project_status];

        if (handler) {
            await handler(state);
        } else {
            console.log(chalk.yellow(`[Engine] Paused. Status: ${state.project_status}. Awaiting user action.`));
            await stopEngineLoop(`Paused in state: ${state.project_status}`);
        }
        
        if (isEngineRunning) {
            engineLoopHandle = setTimeout(loop, 5000); // Wait 5 seconds between cycles
        }
    };
    loop();
}

async function stopEngineLoop(reason) {
    if (!isEngineRunning) return;
    console.log(chalk.bold.red(`\n--- Stigmergy Autonomous Engine Disengaged (Reason: ${reason}) ---\n`));
    isEngineRunning = false;
    if (engineLoopHandle) {
        clearTimeout(engineLoopHandle);
        engineLoopHandle = null;
    }
}

// --- API ENDPOINTS ---

app.post("/api/system/start", async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: "'goal' is required." });

  await stateManager.initializeProject(goal);
  if (process.env.NEO4J_URI) {
     runIndexer().catch(e => console.error(chalk.red("[Engine] Background indexing failed:", e.message)));
  }
  mainEngineLoop();
  res.json({ message: "Project initiated. Autonomous planning has begun." });
});

app.post("/api/control/pause", async (req, res) => {
    await stopEngineLoop("Paused by user");
    await stateManager.pauseProject();
    res.json({ message: "Engine has been paused." });
});

app.post("/api/control/resume", async (req, res) => {
    await stateManager.resumeProject();
    mainEngineLoop();
    res.json({ message: "Engine has been resumed." });
});

app.post("/api/chat", async (req, res) => {
  const { agentId, prompt } = req.body;
  await stateManager.recordChatMessage({ source: 'user', agentId, message: prompt });
  
  let agentResponseText;
  const state = await stateManager.getState();

  if (state.project_status === "AWAITING_EXECUTION_APPROVAL" && agentId === "dispatcher") {
    const approvalPrompt = `The system is awaiting project approval. Analyze the user's message for consent. If they approve, call 'system.approve'. Otherwise, explain you will wait. User message: "${prompt}"`;
    const finalResponse = await llmAdapter.getCompletion(agentId, approvalPrompt, null);
    
    if (finalResponse.action?.tool === 'system.approve') {
        await toolExecutor.execute('system.approve', {}, agentId);
        agentResponseText = "Approval received. Engaging execution phase.";
        mainEngineLoop();
    } else {
        agentResponseText = finalResponse.thought;
    }
  } else {
    const response = await llmAdapter.getCompletion(agentId, prompt, null);
    agentResponseText = response.thought;
  }
  
  await stateManager.recordChatMessage({ source: 'agent', agentId, message: agentResponseText });
  res.json({ reply: agentResponseText });
});

// --- HELPER FUNCTIONS & STARTUP ---

function runIndexer() { /* ... same as before ... */ }

function start() {
  app.listen(PORT, async () => {
    console.log(chalk.bold(`[Server] Stigmergy Engine is listening on http://localhost:${PORT}`));
    try {
        const state = await stateManager.getState();
        if (['GRAND_BLUEPRINT_PHASE', 'EXECUTION_IN_PROGRESS', 'AWAITING_QA'].includes(state.project_status)) {
            console.log(chalk.bold.yellow(`[Engine] Resuming project '${state.project_name}' from status: ${state.project_status}`));
            mainEngineLoop();
        } else {
            console.log(chalk.gray("[Engine] In dormant mode. Awaiting IDE command..."));
        }
    } catch (e) {
        console.error(chalk.red("Failed to initialize state."), e);
    }
  });
}

if (require.main === module) {
  start();
}

if (process.env.NODE_ENV === 'test') {
  module.exports = {
    _appForTesting: app,
    stopEngineLoop,
    mainEngineLoop
  };
}
