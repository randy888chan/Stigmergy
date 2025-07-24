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
  return fs.readJson(STATE_FILE_PATH);
}

async function updateState(newState) {
  return withLock(async () => {
    await fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 });
    return newState;
  });
}

async function initializeProject(goal) {
    const defaultState = require("../.stigmergy-core/templates/state-tmpl.json");
    const projectName = goal.substring(0, 30); // Simple project name from goal
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

async function updateStatus(newStatus) {
    const state = await getState();
    state.project_status = newStatus;
    state.history.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: 'system',
        agent_id: 'engine',
        message: `Project status updated to ${newStatus}`
    });
    return updateState(state);
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
            source: source, // 'user' or 'agent'
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
};
