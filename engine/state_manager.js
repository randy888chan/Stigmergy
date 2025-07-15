const fs = require('fs-extra');
const path = require('path');

const STATE_FILE_PATH = path.resolve(process.cwd(), '.ai', 'state.json');

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  try {
    const state = await fs.readJson(STATE_FILE_PATH, { throws: false });
    if (state) {
        return state;
    }
    // If file is empty or invalid JSON, initialize with default
    const defaultState = require('../.stigmergy-core/templates/state-tmpl.json');
    defaultState.history.timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  } catch (e) {
    console.error("Error reading or initializing state file:", e);
    return require('../.stigmergy-core/templates/state-tmpl.json');
  }
}

async function updateState(newState) {
  await fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 });
  return newState;
}

async function appendHistory(historyEvent) {
  const state = await getState();
  state.history.push({
      ...historyEvent,
      timestamp: new Date().toISOString()
  });
  return updateState(state);
}

async function updateStatus(newStatus) {
    const state = await getState();
    state.project_status = newStatus;
    return updateState(state);
}

async function initializeStateWithGoal(goalFilePath) {
    const goal = await fs.readFile(goalFilePath, 'utf8');
    const state = await getState();
    state.goal = goal;
    state.project_status = "NEEDS_BRIEFING";
    await appendHistory({
        agent_id: 'system',
        signal: 'GOAL_SET',
        summary: `Autonomous engine started with goal: ${goal}`
    });
    return updateState(state);
}

async function incrementTaskFailure(taskId) {
    const state = await getState();
    const task = state.project_manifest?.tasks?.find(t => t.id === taskId);
    if (task) {
        task.failure_count = (task.failure_count || 0) + 1;
        if (task.failure_count >= 2) {
            task.status = "FAILED";
            // TODO: Log to issue_log and dispatch debugger
        }
    }
    return updateState(state);
}


module.exports = {
  getState,
  updateState,
  appendHistory,
  updateStatus,
  initializeStateWithGoal,
  incrementTaskFailure
};
