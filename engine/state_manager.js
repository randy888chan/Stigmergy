const fs = require('fs-extra');
const path = require('path');

const STATE_FILE_PATH = path.resolve(process.cwd(), '.ai', 'state.json');

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  if (!(await fs.pathExists(STATE_FILE_PATH)) || (await fs.readFile(STATE_FILE_PATH, 'utf8')).trim() === '') {
    const defaultState = require('../.stigmergy-core/templates/state-tmpl.json');
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  }
  return fs.readJson(STATE_FILE_PATH);
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

async function updateStatusAndHistory(newStatus, historyEvent) {
  const state = await getState();
  if (newStatus) state.project_status = newStatus;
  state.history.push({
    ...historyEvent,
    timestamp: new Date().toISOString(),
  });
  return updateState(state);
}

async function initializeStateWithGoal(goalPrompt) {
    const goal = goalPrompt.replace(/\*start\s*project/i, '').trim();
    let state = require('../.stigmergy-core/templates/state-tmpl.json'); // Start fresh
    state.goal = goal;
    state.project_status = "NEEDS_BRIEFING";
    state.history[0].summary = `Autonomous engine engaged via IDE with goal: ${goal}`;
    state.history[0].timestamp = new Date().toISOString();
    return updateState(state);
}

async function advanceApprovalState() {
    const state = await getState();
    const currentStatus = state.project_status;
    const transitions = {
        "AWAITING_APPROVAL_BRIEF": "NEEDS_PRD",
        "AWAITING_APPROVAL_PRD": "NEEDS_ARCHITECTURE",
        "AWAITING_APPROVAL_ARCHITECTURE": "NEEDS_BLUEPRINT",
        "AWAITING_APPROVAL_BLUEPRINT": "READY_FOR_EXECUTION",
    };
    const newStatus = transitions[currentStatus] || currentStatus;
    await updateStatusAndHistory(newStatus, { agent_id: 'user', signal: 'MILESTONE_APPROVED', summary: `User approved ${currentStatus}.` });
    return newStatus;
}

async function ingestBlueprint(blueprint) {
    const state = await getState();
    state.project_manifest = blueprint;
    return updateState(state);
}

async function incrementTaskFailure(taskId) {
    const state = await getState();
    const task = state.project_manifest?.tasks?.find(t => t.id === taskId);
    if (task) {
        task.failure_count = (task.failure_count || 0) + 1;
        if (task.failure_count >= 2) {
            task.status = "FAILED";
            // Future: Log to issue_log and dispatch debugger
        }
    }
    return updateState(state);
}

module.exports = {
  getState,
  updateState,
  appendHistory,
  updateStatusAndHistory,
  initializeStateWithGoal,
  advanceApprovalState,
  ingestBlueprint,
  incrementTaskFailure
};
