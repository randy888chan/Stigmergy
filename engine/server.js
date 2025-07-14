const express = require('express');
const stateManager = require('./state_manager');
const agentDispatcher = require('./agent_dispatcher');
const llmAdapter = require('./llm_adapter');
const toolExecutor = require('./tool_executor');

require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let isEnginePaused = false;
let isMetisLoopRunning = false;
let engineInterval;

// --- CONTROL SIGNAL API ---
// These endpoints allow real-time control from the IDE.

app.post('/api/signal/pause', async (req, res) => {
  console.log('[Engine] Received PAUSE signal.');
  isEnginePaused = true;
  await stateManager.updateStatus('EXECUTION_PAUSED');
  res.status(200).json({ message: 'Engine paused.' });
});

app.post('/api/signal/resume', async (req, res) => {
  console.log('[Engine] Received RESUME signal.');
  isEnginePaused = false;
  await stateManager.updateStatus('EXECUTION_IN_PROGRESS');
  res.status(200).json({ message: 'Engine resumed.' });
});

app.post('/api/signal/cancel', async (req, res) => {
  console.log('[Engine] Received CANCEL signal.');
  isEnginePaused = true; // Stop new tasks
  await stateManager.updateStatus('EXECUTION_HALTED');
  res.status(200).json({ message: 'Engine halted. All tasks cancelled.' });
});

// --- INTERACTIVE AGENT API ---
// This is for direct user commands from the IDE to a specific agent.
app.post('/api/interactive', async (req, res) => {
  const { agentId, prompt, history } = req.body;
  console.log(`[Engine] Interactive command for '${agentId}': "${prompt}"`);

  if (!agentId || !prompt) {
    return res.status(400).json({ error: 'agentId and prompt are required.' });
  }

  try {
    const fullPrompt = `User's Request: ${prompt}\n\nConversation History:\n${JSON.stringify(
      history,
      null,
      2
    )}`;
    // In a real interactive session, you'd manage a turn-based loop.
    // For now, we perform a single-turn execution for simplicity.
    const response = await llmAdapter.getCompletion(agentId, fullPrompt, []); // No extra context needed for now
    res.json(response);
  } catch (error) {
    console.error(`[Engine] Interactive Error for ${agentId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// --- CORE DEVELOPMENT LOOP ---
async function developmentLoop() {
  if (isEnginePaused) {
    console.log('[Engine] Loop is paused. Skipping cycle.');
    return;
  }

  const state = await stateManager.getState();
  const nextAction = await agentDispatcher.getNextAction(state);

  if (nextAction.type === 'WAITING') {
    // console.log('[Engine] No immediate action required. Waiting for state changes.');
    return;
  }

  console.log(`[Engine] Dispatching Action: ${nextAction.type} - ${nextAction.summary}`);
  await stateManager.updateStatus(nextAction.newStatus || state.project_status);
  await stateManager.appendHistory({
    agent_id: 'saul',
    signal: `DISPATCH_${nextAction.type}`,
    summary: nextAction.summary,
  });

  // TODO: Execute the dispatched task. This would involve a more complex
  // agent runner than the simple interactive endpoint. For now, we log the dispatch.
  // Example: agentRunner.execute(nextAction.agent, nextAction.task);
}

// --- METIS SELF-IMPROVEMENT LOOP ---
// This runs on a slower, non-blocking interval.
async function metisLoop() {
  if (isMetisLoopRunning) return;
  isMetisLoopRunning = true;
  try {
    const state = await stateManager.getState();
    // Only run Metis if the project is in a stable or complete state
    if (['PROJECT_COMPLETE', 'EXECUTION_HALTED'].includes(state.project_status)) {
      console.log('[Metis Loop] Project is in a suitable state for audit. Dispatching @metis.');
      // This is a fire-and-forget call. Metis works in the background.
      llmAdapter.getCompletion('meta', 'Begin system audit based on recent project history.');
    }
  } catch (error) {
    console.error('[Metis Loop] Error:', error);
  } finally {
    isMetisLoopRunning = false;
  }
}

// Start the server and the orchestration loops
app.listen(PORT, () => {
  console.log(`[Engine] Stigmergy Engine is running on http://localhost:${PORT}`);
  console.log('[Engine] Continuous Execution mode is ACTIVE.');
  console.log('[Engine] Send signals to /api/signal/pause, /resume, or /cancel to control.');

  // The main, fast-paced development loop
  engineInterval = setInterval(developmentLoop, 5000); // Check every 5 seconds

  // The slower, background self-improvement loop
  setInterval(metisLoop, 60000); // Check every 60 seconds
});

process.on('SIGINT', () => {
  console.log('[Engine] Shutting down...');
  clearInterval(engineInterval);
  process.exit();
});
