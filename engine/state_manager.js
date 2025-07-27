const fs = require("fs-extra");
const path = require("path");
const lockfile = require("proper-lockfile");
const { v4: uuidv4 } = require("uuid");

const STATE_FILE_PATH = path.resolve(process.cwd(), ".ai", "state.json");
const LOCK_PATH = `${STATE_FILE_PATH}.lock`;

async function withLock(operation) {
  await fs.ensureDir(path.dirname(LOCK_PATH));
  let release;
  try {
    release = await lockfile.lock(STATE_FILE_PATH, { retries: 5, lockfilePath: LOCK_PATH });
    return await operation();
  } finally {
    if (release) await release();
  }
}

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  if (!(await fs.pathExists(STATE_FILE_PATH))) {
    const defaultState = require("../.stigmergy-core/templates/state-tmpl.json");
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  }
  return fs.readJson(STATE_FILE_PATH);
}

async function updateState(newState) {
  return withLock(() => fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 }));
}

async function initializeProject(goal) {
  const defaultState = require("../.stigmergy-core/templates/state-tmpl.json");
  const projectName = goal.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
  const initialState = {
    ...defaultState,
    project_name: projectName,
    goal: goal,
    project_status: "GRAND_BLUEPRINT_PHASE",
    history: [{
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: "user",
      agent_id: "system",
      message: `Project initialized with goal: ${goal}`
    }]
  };
  return updateState(initialState);
}

async function updateStatus(newStatus, message) {
  return withLock(async () => {
    const state = await getState();
    state.project_status = newStatus;
    state.history.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: 'system',
      agent_id: 'engine',
      message: message || `Project status updated to ${newStatus}`
    });
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
    return state;
  });
}

async function pauseProject() {
  return withLock(async () => {
    const state = await getState();
    // Persist the current status to the state file itself.
    state.status_before_pause = state.project_status;
    state.project_status = "PAUSED_BY_USER";
    state.history.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: 'user',
      agent_id: 'system',
      message: 'Project paused by user command.'
    });
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

async function resumeProject() {
  return withLock(async () => {
    const state = await getState();
    // Resume to the persisted state from the file.
    const statusBeforePause = state.status_before_pause || 'GRAND_BLUEPRINT_PHASE';
    state.project_status = statusBeforePause;
    state.status_before_pause = null; // Clear the temporary state.
    state.history.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: 'user',
      agent_id: 'system',
      message: `Project resumed by user command. Returning to status: ${statusBeforePause}`
    });
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

async function updateTaskStatus(taskId, status) {
  return withLock(async () => {
    const state = await getState();
    const task = state.project_manifest.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      if (status === 'IN_PROGRESS') task.failure_count = 0;
    }
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

async function recordTaskFailure(taskId) {
  return withLock(async () => {
    const state = await getState();
    const task = state.project_manifest.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = "FAILED";
      task.failure_count = (task.failure_count || 0) + 1;
    }
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

async function setIndexedFlag(value) { /* ... same as before ... */ }
async function recordChatMessage({ source, agentId, message }) { /* ... same as before ... */ }

module.exports = {
  getState,
  updateState,
  initializeProject,
  updateStatus,
  setIndexedFlag,
  recordChatMessage,
  pauseProject,
  resumeProject,
  updateTaskStatus,
  recordTaskFailure
};
