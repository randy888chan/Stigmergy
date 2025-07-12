const express = require('express');
const stateManager = require('./state_manager');
const agentDispatcher = require('./agent_dispatcher');
const toolExecutor = require('./tool_executor');
const llmAdapter = require('./llm_adapter');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/execute', async (req, res) => {
  try {
    const { agentId, conversation } = req.body;
    console.log(`[Engine] Received request for agent: ${agentId}`);

    const state = await stateManager.getState();
    const dispatcher = agentDispatcher(state);

    // For now, we'll execute the requested agent directly.
    // In the future, the dispatcher can have more complex logic.
    const agentToExecute = agentId || dispatcher.getNextAgent();

    let currentPrompt = `Conversation History:\n${JSON.stringify(conversation, null, 2)}`;
    let result = { done: false, content: "" };

    // Simplified "thought-action" loop
    while (!result.done) {
      const response = await llmAdapter.getCompletion(agentToExecute, currentPrompt);
      
      if (response.action && response.action.tool) {
        console.log(`[Engine] Executing tool: ${response.action.tool}`);
        const toolResult = await toolExecutor.execute(response.action.tool, response.action.args);
        currentPrompt += `\nObservation: ${JSON.stringify(toolResult)}`;
      } else {
        result.done = true;
        result.content = response.thought; // or final answer
      }
    }

    res.json({ success: true, response: result.content });
  } catch (error) {
    console.error('[Engine] Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Engine] Stigmergy Engine is running on http://localhost:${PORT}`);
});
