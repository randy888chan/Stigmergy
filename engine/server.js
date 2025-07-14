const express = require('express');
const stateManager = require('./state_manager');
const agentDispatcher = require('./agent_dispatcher');
const toolExecutor = require('./tool_executor');
const llmAdapter = require('./llm_adapter');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.post('/api/execute', async (req, res) => {
  try {
    const { agentId, conversation } = req.body;
    if (!agentId) {
      return res.status(400).json({ success: false, error: "agentId is required." });
    }

    console.log(`[Engine] Received request for agent: ${agentId}`);

    const state = await stateManager.getState();
    const dispatcher = agentDispatcher(state);

    // For now, we execute the requested agent directly.
    // In a future state, the dispatcher could override this for system-level tasks.
    const agentToExecute = agentId || dispatcher.getNextAgent();
    
    let lastUserMessage = "No user message found.";
    if (conversation && conversation.length > 0) {
        lastUserMessage = conversation[conversation.length - 1].content;
    }
    
    let currentPrompt = `Task: ${lastUserMessage}\n\nBegin execution.`;
    let response;
    const MAX_TURNS = 10; // Safety break to prevent infinite loops
    let turns = 0;

    // Start the "thought-action" loop
    while (turns < MAX_TURNS) {
      turns++;
      console.log(`\n[Turn ${turns}] Calling ${agentToExecute}...`);
      
      response = await llmAdapter.getCompletion(agentToExecute, currentPrompt);
      
      console.log(`[Turn ${turns}] Thought: ${response.thought}`);

      if (response.action && response.action.tool) {
        console.log(`[Turn ${turns}] Action: Executing ${response.action.tool}`);
        try {
          const toolResult = await toolExecutor.execute(response.action.tool, response.action.args);
          currentPrompt = `Previous thought: ${response.thought}\nObservation: ${JSON.stringify(toolResult)}`;
        } catch (toolError) {
          console.error(`[Turn ${turns}] Tool Error:`, toolError);
          currentPrompt = `Previous thought: ${response.thought}\nObservation: Tool execution failed with error: ${toolError.message}. Re-evaluate your plan.`;
        }
      } else {
        // Agent has finished its task
        console.log(`[Engine] Agent ${agentToExecute} completed its task.`);
        break; 
      }
    }

    if (turns >= MAX_TURNS) {
        console.warn("[Engine] Maximum turns reached. Ending loop.");
        response.thought += "\n[SYSTEM] Maximum turns reached. Task may be incomplete.";
    }

    res.json({ success: true, response: response.thought });

  } catch (error) {
    console.error('[Engine] Critical Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`[Engine] Stigmergy Engine is running on http://localhost:${PORT}`);
});
