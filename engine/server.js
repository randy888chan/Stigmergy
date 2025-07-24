const express = require("express");
const chalk = require("chalk");
const path = require("path");
const { spawn } = require("child_process");
const stateManager = require("./state_manager");
const llmAdapter = require("./llm_adapter");
const toolExecutor = require("./tool_executor");

require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEngineRunning = false;

// This is a placeholder for the main autonomous loop logic.
// The key is that it's started and stopped by the server state.
async function mainEngineLoop() {
    if (isEngineRunning) {
      console.log(chalk.yellow("[Engine] Loop is already running."));
      return;
    }
    isEngineRunning = true;
    console.log(chalk.bold.green("\n--- Stigmergy Autonomous Engine Engaged ---\n"));

    while(isEngineRunning) {
        const state = await stateManager.getState();
        console.log(chalk.cyan(`[Engine] New cycle. Current status: ${state.project_status}`));
        
        if (["PROJECT_COMPLETE", "AWAITING_EXECUTION_APPROVAL", "EXECUTION_HALTED"].includes(state.project_status)) {
            console.log(chalk.yellow(`[Engine] Paused. Status: ${state.project_status}. Awaiting user action or command.`));
            isEngineRunning = false;
            break;
        }

        // TODO: Implement the full state-driven agent dispatch logic here.
        // For now, we will simulate a cycle and wait.
        console.log("[Engine] Simulating a work cycle...");
        await new Promise(resolve => setTimeout(resolve, 10000)); // Simulate work
    }
    console.log(chalk.bold.red("\n--- Stigmergy Autonomous Engine Disengaged ---\n"));
}


// --- API Endpoints ---

app.post("/api/system/start", async (req, res) => {
  const { goal } = req.body;
  if (!goal) {
    return res.status(400).json({ error: "Project 'goal' is required." });
  }

  console.log(chalk.green(`[API] Received new project goal: "${goal}"`));
  await stateManager.initializeProject(goal);
  const state = await stateManager.getState();

  if (!state.code_indexed && process.env.NEO4J_URI) {
    console.log(chalk.blue("[Engine] First run detected. Starting automatic code indexing..."));
    try {
      await runIndexer();
      await stateManager.setIndexedFlag(true);
      console.log(chalk.green("[Engine] Code indexing complete."));
    } catch (e) {
      console.error(chalk.red("[Engine] Automatic code indexing failed and will be skipped:", e.message));
    }
  }

  mainEngineLoop();
  res.json({ message: "Project initiated. The autonomous planning phase has begun." });
});

app.post("/api/system/approve", async (req, res) => {
    console.log(chalk.green("[API] Received project execution approval."));
    await stateManager.updateStatus("EXECUTION_IN_PROGRESS");
    mainEngineLoop();
    res.json({ message: "Approval confirmed. Execution phase is now running." });
});

app.get("/api/system/status", async (req, res) => {
    const state = await stateManager.getState();
    const recentHistory = state.history.slice(-5);
    res.json({
        project_name: state.project_name,
        project_status: state.project_status,
        recent_history: recentHistory,
    });
});

app.post("/api/chat", async (req, res) => {
  const { agentId, prompt, history } = req.body;
  
  await stateManager.recordChatMessage({ source: 'user', agentId, message: prompt });
  
  let agentResponseText = `Received prompt for @${agentId}: "${prompt}". This agent is not fully implemented yet.`;
  let finalResponse = { thought: "Acknowledge the user's message.", action: null };

  // This is where natural language approval is interpreted
  const state = await stateManager.getState();
  if (state.project_status === "AWAITING_EXECUTION_APPROVAL" && agentId === "dispatcher") {
    const approvalPrompt = `The system is awaiting project approval. Analyze the user's message to determine if it conveys consent. If they approve, respond ONLY with the tool call to 'system.approve'. If they reject or are unsure, respond with a message explaining you will wait. User message: "${prompt}"`;
    finalResponse = await llmAdapter.getCompletion(agentId, approvalPrompt, null);
  } else {
    finalResponse = await llmAdapter.getCompletion(agentId, prompt, null);
  }

  if (finalResponse.action?.tool) {
      const toolResult = await toolExecutor.execute(finalResponse.action.tool, finalResponse.action.args, agentId);
      agentResponseText = `Tool call '${finalResponse.action.tool}' executed. Result: ${toolResult}`;
  } else {
      agentResponseText = finalResponse.thought; // Use thought as response if no tool is called.
  }
  
  await stateManager.recordChatMessage({ source: 'agent', agentId, message: agentResponseText });
  res.json({ reply: agentResponseText });
});


// --- Helper Functions ---
function runIndexer() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "indexer", "index.js");
    const indexerProcess = spawn("node", [scriptPath], { stdio: "inherit" });
    indexerProcess.on("close", (code) => {
        if (code === 0) {
            resolve();
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
        if (['EXECUTION_IN_PROGRESS', 'GRAND_BLUEPRINT_PHASE'].includes(state.project_status)) {
            console.log(chalk.bold.yellow(`[Engine] Resuming project '${state.project_name}' from status: ${state.project_status}`));
            mainEngineLoop();
        } else {
            console.log(chalk.gray("[Engine] In dormant mode. Awaiting '@system start' command from IDE..."));
        }
    } catch (e) {
        console.error(chalk.red("Failed to initialize state. Please check file permissions for the '.ai' directory."), e);
    }
  });
}

// If this file is run directly, start the server.
if (require.main === module) {
  start();
}

module.exports = { start };
