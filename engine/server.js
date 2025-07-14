const express = require('express');
const stateManager = require('./state_manager');
const agentDispatcher = require('./agent_dispatcher');
const llmAdapter = require('./llm_adapter');

require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
let engineInterval;

// This endpoint is the single entry point for all user interaction from the IDE.
app.post('/api/interactive', async (req, res) => {
  const { agentId, prompt, history } = req.body;
  console.log(`[Engine] Interactive command for '${agentId}': "${prompt}"`);

  if (!agentId || !prompt) {
    return res.status(400).json({ error: 'agentId and prompt are required.' });
  }

  try {
    const state = await stateManager.getState();
    let finalPrompt = `User's Request: ${prompt}\n\nConversation History:\n${JSON.stringify(history, null, 2)}`;

    // Implement the "Command vs. Commentary" Protocol
    // For simplicity, we check a hypothetical 'active_task' in the agent's state.
    // A real implementation would have a more robust state tracking per agent.
    if (state.agents && state.agents[agentId]?.active_task) {
        finalPrompt = `CONTEXT: You are currently executing task [${state.agents[agentId].active_task}]. The user has provided the following commentary. Use it for clarification only. Do not abandon your primary task.\n\nUSER_COMMENTARY: ${prompt}`;
    }
    
    const response = await llmAdapter.getCompletion(agentId, finalPrompt);
    res.json(response);
  } catch (error) {
    console.error(`[Engine] Interactive Error for ${agentId}:`, error);
    res.status(500).json({ success: false, error: error.message });
  }
});

async function mainEngineLoop() {
  const state = await stateManager.getState();
  
  // The dispatcher is now artifact-aware.
  const nextAction = await agentDispatcher.getNextAction(state);

  if (nextAction.type === 'WAITING') {
    return; // Do nothing if the system is idle or complete
  }

  console.log(`[Engine] Dispatching Action: ${nextAction.type} - ${nextAction.summary}`);
  
  // In a real system, you would now trigger the agent (`nextAction.agent`) with the task (`nextAction.task`).
  // This is a complex agent runner that is beyond a single file generation.
  // For now, we simulate this by updating the state.
  await stateManager.updateStatus(nextAction.newStatus || state.project_status);
  await stateManager.appendHistory({
    agent_id: 'saul',
    signal: `DISPATCH_${nextAction.type}`,
    summary: nextAction.summary,
  });
}

// Start the server and the orchestration loop
app.listen(PORT, () => {
  console.log(`[Engine] Pheromind Engine is running on http://localhost:${PORT}`);
  console.log('[Engine] Continuous Execution mode is ACTIVE.');

  engineInterval = setInterval(mainEngineLoop, 5000); // Check every 5 seconds
});

process.on('SIGINT', () => {
  console.log('[Engine] Shutting down...');
  clearInterval(engineInterval);
  process.exit();
});
