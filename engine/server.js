const express = require('express');
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const llmAdapter = require('./llm_adapter');
const toolExecutor = require('./tool_executor');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const MANIFEST_PATH = path.join(process.cwd(), '.execution_plan', 'manifest.yml');

// --- Agent Runner Endpoint ---
// This endpoint executes a single agent for a single task.
app.post('/api/execute', async (req, res) => {
  const { agentId, taskPath } = req.body;
  console.log(`[Agent Runner] Executing agent '${agentId}' for task '${taskPath}'`);

  try {
    const taskContent = await fs.readFile(path.join(process.cwd(), taskPath), 'utf8');
    let currentPrompt = `Task Package:\n${taskContent}\n\nBegin execution.`;
    
    let turns = 0;
    const MAX_TURNS = 15;
    let lastError = null;
    let errorCount = 0;

    while (turns < MAX_TURNS) {
      turns++;
      const response = await llmAdapter.getCompletion(agentId, currentPrompt);

      if (response.action && response.action.tool) {
        try {
          const toolResult = await toolExecutor.execute(response.action.tool, response.action.args);
          currentPrompt = `Previous thought: ${response.thought}\nObservation: ${JSON.stringify(toolResult)}`;
          lastError = null; // Reset error on successful tool use
          errorCount = 0;
        } catch (toolError) {
          console.error(`[Agent Runner] Tool Error for ${agentId}:`, toolError.message);
          currentPrompt = `Previous thought: ${response.thought}\nObservation: Tool execution failed with error: ${toolError.message}. Re-evaluate your plan.`;
          
          // Escalation Protocol Logic
          if (lastError === toolError.message) {
            errorCount++;
          } else {
            lastError = toolError.message;
            errorCount = 1;
          }
          if (errorCount >= 2) {
            console.log(`[Agent Runner] Escalating task ${taskPath} due to repeated failures.`);
            // In a real system, this would dispatch @debugger. For now, we mark as FAILED.
            res.status(500).json({ success: false, error: 'Task failed and escalated.', taskPath });
            return;
          }
        }
      } else {
        console.log(`[Agent Runner] Agent '${agentId}' completed task '${taskPath}'.`);
        res.json({ success: true, result: response.thought, taskPath });
        return;
      }
    }
    res.status(500).json({ success: false, error: 'Task exceeded maximum turns.', taskPath });
  } catch (error) {
    console.error(`[Agent Runner] Critical Error for ${agentId}:`, error);
    res.status(500).json({ success: false, error: error.message, taskPath });
  }
});


// --- Orchestration Loop ---
// This is the master loop that dispatches tasks.
async function orchestrationLoop() {
  if (!await fs.pathExists(MANIFEST_PATH)) {
    return; // No plan to execute
  }

  const manifest = yaml.load(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const tasksToRun = [];

  for (const task of manifest.tasks) {
    if (task.status === 'PENDING') {
      const dependenciesMet = task.dependencies.every(depId => {
        const depTask = manifest.tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'COMPLETED';
      });

      if (dependenciesMet) {
        tasksToRun.push(task);
      }
    }
  }

  if (tasksToRun.length > 0) {
    console.log(`[Orchestrator] Dispatching ${tasksToRun.length} tasks concurrently.`);
    for (const task of tasksToRun) {
      task.status = 'IN_PROGRESS';
      // Asynchronously dispatch the task without waiting for the result here
      axios.post(`http://localhost:${PORT}/api/execute`, { agentId: task.agent, taskPath: task.path })
        .then(response => {
          console.log(`[Orchestrator] Task '${task.id}' COMPLETED.`);
          updateTaskStatus(task.id, 'COMPLETED');
        })
        .catch(error => {
          console.error(`[Orchestrator] Task '${task.id}' FAILED.`);
          updateTaskStatus(task.id, 'FAILED');
        });
    }
    // Update the manifest with IN_PROGRESS statuses
    await fs.writeFile(MANIFEST_PATH, yaml.dump(manifest));
  }
}

async function updateTaskStatus(taskId, status) {
  if (!await fs.pathExists(MANIFEST_PATH)) return;
  const manifest = yaml.load(await fs.readFile(MANIFEST_PATH, 'utf8'));
  const task = manifest.tasks.find(t => t.id === taskId);
  if (task) {
    task.status = status;
    await fs.writeFile(MANIFEST_PATH, yaml.dump(manifest));
  }
}

// Start the server and the orchestration loop
app.listen(PORT, () => {
  console.log(`[Engine] Stigmergy Engine is running on http://localhost:${PORT}`);
  console.log('[Orchestrator] Starting main loop...');
  setInterval(orchestrationLoop, 5000); // Check for new tasks every 5 seconds
});
