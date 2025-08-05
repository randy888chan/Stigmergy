import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import fs from "fs-extra";
import path from "path";

const DB_PATH =
  process.env.NODE_ENV === "test"
    ? ":memory:"
    : path.resolve(process.cwd(), ".ai", "state.db");

async function initDB() {
  if (process.env.NODE_ENV !== "test") {
    await fs.ensureDir(path.dirname(DB_PATH));
  }
  const db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS state (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);
  return db;
}

async function _getState(db) {
  const result = await db.get('SELECT value FROM state WHERE key = "current"');
  if (result) {
    try {
      return JSON.parse(result.value);
    } catch (e) {
      console.error("Failed to parse state from DB, returning null.", e);
      return null;
    }
  }
  const defaultStatePath = path.join(process.cwd(), ".stigmergy-core/templates/state-tmpl.json");
  if (await fs.pathExists(defaultStatePath)) {
    const defaultState = await fs.readJson(defaultStatePath);
    defaultState.history[0].timestamp = new Date().toISOString();
    await _updateState(db, defaultState);
    return defaultState;
  }
  return null;
}

async function _updateState(db, state) {
  await db.run(
    "INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)",
    "current",
    JSON.stringify(state, null, 2)
  );
}

export async function getState() {
  const db = await initDB();
  return _getState(db);
}

export async function updateState(newState) {
  const db = await initDB();
  await _updateState(db, newState);
}

export async function initializeProject(goal) {
  const db = await initDB();
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
  await _updateState(db, initialState);
}

export async function updateStatus({ newStatus, message, artifact_created = null }) {
  const db = await initDB();
  const state = await _getState(db);

  if (newStatus) {
    state.project_status = newStatus;
  }

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

  await _updateState(db, state);
}

export async function pauseProject() {
  const db = await initDB();
  const state = await _getState(db);
  state.status_before_pause = state.project_status;
  state.project_status = "PAUSED_BY_USER";
  await _updateState(db, state);
}

export async function resumeProject() {
  const db = await initDB();
  const state = await _getState(db);
  state.project_status = state.status_before_pause || "GRAND_BLUEPRINT_PHASE";
  state.status_before_pause = null;
  await _updateState(db, state);
}

export async function updateTaskStatus({ taskId, newStatus }) {
  const db = await initDB();
  const state = await _getState(db);
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
    await _updateState(db, state);
  }
}
