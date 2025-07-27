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
// Each handler is responsible for the actions taken in a specific state.

async function handleGrandBlueprintPhase(state) {
  console.log(chalk.blue("[Engine] Executing Grand Blueprint Phase..."));
  // In a real scenario, this would dispatch a sequence of planner agents.
  // For now, we simulate the planning and transition the state.
  await new Promise(resolve => setTimeout(resolve, 5000)); // Simulate planning work
  
  // This is the single approval gate.
  await stateManager.updateStatus("AWAITING_EXECUTION_APPROVAL", "Grand Blueprint complete. Awaiting user approval.");
}

async function handleExecutionInProgress(state) {
  console.log(chalk.blue("[Engine] Executing next task in manifest..."));
  const { tasks } = state.project_manifest;
  const nextTask = tasks.find(t => t.status === "PENDING");

  if (!nextTask) {
    await stateManager.updateStatus("PROJECT_COMPLETE", "All tasks in the manifest have been completed.");
    return;
  }

  console.log(chalk.cyan(`[Engine] Starting task: ${nextTask.id} - ${nextTask.summary}`));
  await stateManager.updateTaskStatus(nextTask.id, "IN_PROGRESS");

  try {
    // Determine which executor to use based on config
    const executorAgent = config.executor_preference === 'gemini' ? 'gemini-executor' : 'dev';
    console.log(`[Engine] Dispatching to executor: @${executorAgent}`);
    
    // Simulate agent execution. A real implementation would use the llm_adapter.
    await new Promise(resolve => setTimeout(resolve, 8000)); // Simulate task work
    
    // TODO: A real implementation needs a QA/Verification step here.
    
    await stateManager.updateTaskStatus(nextTask.id, "COMPLETED");
    console.log(chalk.green(`[Engine] Task ${nextTask.id} completed.`));

  } catch (error) {
    console.error(chalk.red(`[Engine] Task ${nextTask.id} failed:`), error);
    await stateManager.recordTaskFailure(nextTask.id);
    // The loop will automatically check for repeated failures on the next cycle.
  }
}

async function handleProjectComplete(state) {
    console.log(chalk.bold.green("[Engine] Project is complete."));
    // TODO: Trigger @metis agent for self-improvement analysis as a non-blocking background task.
    await stopEngineLoop("Project Complete");
}

const stateHandlers = {
    'GRAND_BLUEPRINT_PHASE': handleGrandBlueprintPhase,
    'EXECUTION_IN_PROGRESS': handleExecutionInProgress,
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
            await stopEngineLoop("Awaiting user action");
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

// --- API Endpoints ---

// Project Lifecycle
app.post("/api/system/start", async (req, res) => {
  const { goal } = req.body;
  if (!goal) return res.status(400).json({ error: "Project 'goal' is required." });

  await stateManager.initializeProject(goal);
  
  if (process.env.NEO4J_URI) {
     // Run indexer in the background, don't block.
     runIndexer().catch(e => console.error(chalk.red("[Engine] Background code indexing failed:", e.message)));
  }

  mainEngineLoop();
  res.json({ message: "Project initiated. The autonomous planning phase has begun." });
});

// Real-time User Control from IDE
app.post("/api/control/pause", async (req, res) => {
    await stopEngineLoop("Paused by user");
    await stateManager.pauseProject();
    res.json({ message: "Engine paused." });
});

app.post("/api/control/resume", async (req, res) => {
    await stateManager.resumeProject();
    mainEngineLoop();
    res.json({ message: "Engine resumed." });
});

// Conversational Interface
app.post("/api/chat", async (req, res) => {
  const { agentId, prompt } = req.body;
  
  await stateManager.recordChatMessage({ source: 'user', agentId, message: prompt });
  
  let agentResponseText;
  
  // Natural language approval gate for @dispatcher
  const state = await stateManager.getState();
  if (state.project_status === "AWAITING_EXECUTION_APPROVAL" && agentId === "dispatcher") {
    const approvalPrompt = `The system is awaiting project approval. Analyze the user's message to determine if it conveys consent. If they approve, respond ONLY with the tool call to 'system.approve'. If they reject or are unsure, respond with a message explaining you will wait. User message: "${prompt}"`;
    const finalResponse = await llmAdapter.getCompletion(agentId, approvalPrompt, null);
    
    if (finalResponse.action?.tool === 'system.approve') {
        const toolResult = await toolExecutor.execute(finalResponse.action.tool, finalResponse.action.args, agentId);
        agentResponseText = `Approval received. Engaging execution phase.`;
        mainEngineLoop(); // Re-engage the loop upon approval
    } else {
        agentResponseText = finalResponse.thought;
    }
  } else {
    // Standard agent interaction
    const response = await llmAdapter.getCompletion(agentId, prompt, null);
    agentResponseText = response.thought;
  }
  
  await stateManager.recordChatMessage({ source: 'agent', agentId, message: agentResponseText });
  res.json({ reply: agentResponseText });
});


// --- Helper Functions ---
function runIndexer() {
  return new Promise((resolve, reject) => {
    console.log(chalk.blue("[Engine] Starting automatic code indexing..."));
    const scriptPath = path.join(__dirname, "..", "indexer", "index.js");
    const indexerProcess = spawn("node", [scriptPath], { stdio: "inherit" });
    indexerProcess.on("close", (code) => {
        if (code === 0) {
            console.log(chalk.green("[Engine] Code indexing complete."));
            stateManager.setIndexedFlag(true).then(resolve);
        } else {
            reject(new Error(`Indexer process exited with code ${code}`));
        }
    });
    indexerProcess.on("error", (err) => reject(err));
  });
}

function start() {
  app.listen(PORT, async () => {
    console.log(chalk.bold(`[Server] Stigmergy Engine is listening on http://localhost:${PORT}`));
    try {
        const state = await stateManager.getState();
        if (['GRAND_BLUEPRINT_PHASE', 'EXECUTION_IN_PROGRESS'].includes(state.project_status)) {
            console.log(chalk.bold.yellow(`[Engine] Resuming project '${state.project_name}' from status: ${state.project_status}`));
            mainEngineLoop();
        } else {
            console.log(chalk.gray("[Engine] In dormant mode. Awaiting '@system start' command from IDE..."));
        }
    } catch (e) {
        console.error(chalk.red("Failed to initialize state."), e);
    }
  });
}

if (require.main === module) {
  start();
}

module.exports = { start };
