const fs = require('fs-extra');
const path = require('path');
const lockfile = require('proper-lockfile');
const { v4: uuidv4 } = require('uuid');

// MODIFICATION: Use the central configuration file
const config = require(path.resolve(process.cwd(), 'stigmergy.config.js'));
const STATE_FILE_PATH = path.resolve(process.cwd(), config.stateFile);
const LOCK_PATH = `${STATE_FILE_PATH}.lock`;

async function getState() {
  await fs.ensureDir(path.dirname(STATE_FILE_PATH));
  if (!(await fs.pathExists(STATE_FILE_PATH))) {
    const defaultState = require('../.stigmergy-core/templates/state-tmpl.json');
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

async function updateStatusAndHistory(newStatus, historyEvent) {
  const state = await getState();
  if (newStatus) state.project_status = newStatus;
  state.history.push({
    id: uuidv4(),
    ...historyEvent,
    timestamp: new Date().toISOString(),
  });
  return updateState(state);
}

// ... include all other functions from your existing state_manager.js
// (e.g., initializeStateForGrandBlueprint, recordTaskCompletion, etc.)
// They do not need to be changed as they rely on the updated functions above.
