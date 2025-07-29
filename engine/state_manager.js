import fs from "fs-extra";
import path from "path";
import lockfile from "proper-lockfile";
import { v4 as uuidv4 } from "uuid";

// --- FIX: Convert static paths to dynamic functions ---
const getStateFilePath = () => path.resolve(process.cwd(), ".ai", "state.json");
const getLockPath = () => `${getStateFilePath()}.lock`;
// ----------------------------------------------------

async function withLock(operation) {
  const stateFilePath = getStateFilePath();
  const lockPath = getLockPath();
  await fs.ensureDir(path.dirname(lockPath));
  let release;
  try {
    release = await lockfile.lock(stateFilePath, { retries: 5, lockfilePath: lockPath });
    return await operation();
  } finally {
    if (release) await release();
  }
}

export async function getState() {
  const stateFilePath = getStateFilePath();
  if (!(await fs.pathExists(stateFilePath))) {
    const defaultState = await fs.readJson(
      path.join(process.cwd(), ".stigmergy-core/templates/state-tmpl.json")
    );
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(stateFilePath, defaultState, { spaces: 2 });
    return defaultState;
  }
  return fs.readJson(stateFilePath);
}

export async function updateState(newState) {
  return withLock(() => fs.writeJson(getStateFilePath(), newState, { spaces: 2 }));
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

    if (artifact_created && state.artifacts_created.hasOwnProperty(artifact_created)) {
      state.artifacts_created[artifact_created] = true;
    }

    await fs.writeJson(getStateFilePath(), state, { spaces: 2 });
  });
}

export async function pauseProject() {
  return withLock(async () => {
    const state = await getState();
    state.status_before_pause = state.project_status;
    state.project_status = "PAUSED_BY_USER";
    await fs.writeJson(getStateFilePath(), state, { spaces: 2 });
  });
}

export async function resumeProject() {
  return withLock(async () => {
    const state = await getState();
    state.project_status = state.status_before_pause || "GRAND_BLUEPRINT_PHASE";
    state.status_before_pause = null;
    await fs.writeJson(getStateFilePath(), state, { spaces: 2 });
  });
}

export async function updateTaskStatus(taskId, newStatus) {
  return withLock(async () => {
    const state = await getState();
    const taskIndex = state.project_manifest?.tasks?.findIndex((t) => t.id === taskId);

    if (taskIndex !== -1 && taskIndex !== undefined) {
      state.project_manifest.tasks[taskIndex].status = newStatus;
      state.history.push({
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: "system",
        agent_id: "engine",
        message: `Task ${taskId} status updated to ${newStatus}.`,
      });
      await fs.writeJson(getStateFilePath(), state, { spaces: 2 });
    }
  });
}
