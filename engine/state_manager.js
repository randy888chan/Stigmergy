import fs from "fs-extra";
import path from "path";
import lockfile from "proper-lockfile";
import { v4 as uuidv4 } from "uuid";

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

export async function getState() {
  if (!(await fs.pathExists(STATE_FILE_PATH))) {
    const defaultState = await fs.readJson(
      path.join(process.cwd(), ".stigmergy-core/templates/state-tmpl.json")
    );
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  }
  return fs.readJson(STATE_FILE_PATH);
}

export async function updateState(newState) {
  return withLock(() => fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 }));
}

export async function initializeProject(goal) {
  const defaultState = await fs.readJson(
    path.join(process.cwd(), ".stigmergy-core/templates/state-tmpl.json")
  );
  const projectName = goal.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "-");
  const initialState = {
    ...defaultState,
    project_name: projectName,
    goal,
    project_status: "GRAND_BLUEPRINT_PHASE",
    history: [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: "user",
        agent_id: "system",
        message: `Project initialized: ${goal}`,
      },
    ],
  };
  return updateState(initialState);
}

export async function updateStatus(newStatus, message, artifact_created = null) {
  return withLock(async () => {
    const state = await getState();
    state.project_status = newStatus;
    state.history.push({
      id: uuidv4(),
      timestamp: new Date().toISOString(),
      source: "system",
      agent_id: "engine",
      message: message || `Status updated to ${newStatus}`,
    });
    
    // Explicitly update artifact status if provided
    if (artifact_created && state.artifacts_created.hasOwnProperty(artifact_created)) {
      state.artifacts_created[artifact_created] = true;
    }

    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

export async function pauseProject() {
  return withLock(async () => {
    const state = await getState();
    state.status_before_pause = state.project_status;
    state.project_status = "PAUSED_BY_USER";
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

export async function resumeProject() {
  return withLock(async () => {
    const state = await getState();
    state.project_status = state.status_before_pause || "GRAND_BLUEPRINT_PHASE";
    state.status_before_pause = null;
    await fs.writeJson(STATE_FILE_PATH, state, { spaces: 2 });
  });
}

export async function updateTaskStatus(taskId, status) {
  // Implementation placeholder
}
