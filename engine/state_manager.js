const fs = require("fs-extra");
const path = require("path");
const lockfile = require("proper-lockfile");
const { v4: uuidv4 } = require("uuid");

const STATE_FILE_PATH = path.resolve(process.cwd(), ".ai", "state.json");
const LOCK_PATH = `${STATE_FILE_PATH}.lock`;
let lastKnownStatus = null; // In-memory cache for previous status

async function withLock(operation) {
  await fs.ensureDir(path.dirname(LOCK_PATH));
  let release;
  try {
    release = await lockfile.lock(STATE_FILE_PATH, { retries: 5, lockfilePath: LOCK_PATH });
    const result = await operation();
    return result;
  } finally {
    if (release) {
      await release();
    }
  }
}

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  if (!(await fs.pathExists(STATE_FILE_PATH))) {
    const defaultState = require("../.stigmergy-core/templates/state-tmpl.json");
    defaultState.history.timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  }
  const state = await fs.readJson(STATE_FILE_PATH);
  lastKnownStatus = state.project_status;
  return state;
}

async function updateState(newState) {
  return withLock(async () => {
    await fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 });
    return newState;
  });
}

async function initializeProject(goal) {
    const defaultState = require("../.stigmergy-core/templates/state-tmpl.json");
    const projectName = goal.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-');
    const initialState = {
        ...defaultState,
        project_name: projectName,
        goal: goal,
        project_status: "GRAND_BLUEPRINT_PHASE",
        history: [
            ...defaultState.history,
            {
                id: uuidv4(),
                timestamp: new Date().toISOString(),
                source: "user",
                agent_id: "system",
                message: `Project initialized with goal: ${goal}`
            }
        ]
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
        lastKnownStatus = newStatus;
        return state;
    });
}

async function pauseProject() {
    return updateStatus("PAUSED_BY_USER", "Project paused by user command.");
}

async function resumeProject() {
    const state = await getState();
    const previousStatus = state.history
        .slice()
        .reverse()
        .find(h => h.message.startsWith("Project status updated to") && h.message.split(" ").pop() !== "PAUSED_BY_USER")
        ?.message.split(" ").pop() || 'GRAND_BLUEPRINT_PHASE';
    
    return updateStatus(previousStatus, "Project resumed by user command.");
}

async function updateTaskStatus(taskId, status) {
    return withLock(async () => {
        const state = await getState();
        const task = state.project_manifest.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = status;
            if (status === 'IN_PROGRESS') task.failure_count = 0; // Reset on new attempt
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


async function setIndexedFlag(value) {
    return withLock(async () => {
        const state = await getState();
        state.code_indexed = value;
        await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
    });
}

async function recordChatMessage({ source, agentId, message }) {
    return withLock(async () => {
        const state = await getState();
        state.history.push({
            id: uuidv4(),
            timestamp: new Date().toISOString(),
            source: source,
            agent_id: agentId,
            message: message,
        });
        await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
    });
}

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
