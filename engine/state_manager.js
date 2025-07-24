const fs = require("fs-extra");
const path = require("path");
const lockfile = require("proper-lockfile");
const { v4: uuidv4 } = require("uuid");

const STATE_FILE_PATH = path.resolve(process.cwd(), ".ai", "state.json");
const LOCK_PATH = `${STATE_FILE_PATH}.lock`;

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
  await fs.ensureDir(path.dirname(LOCK_PATH));
  let release;
  try {
    release = await lockfile.lock(STATE_FILE_PATH, {
      retries: 5,
      lockfilePath: LOCK_PATH,
    });
    await fs.writeJson(STATE_FILE_PATH, newState, { spaces: 2 });
  } finally {
    if (release) {
      await release();
    }
  }
  return newState;
}

// ... all other functions from your state_manager.js should remain here ...
