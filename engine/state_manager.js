const fs = require('fs-extra');
const path = require('path');

const STATE_FILE_PATH = path.resolve(process.cwd(), '.ai', 'state.json');

async function getState() {
  await fs.ensureFile(STATE_FILE_PATH);
  try {
    const state = await fs.readJson(STATE_FILE_PATH, { throws: false });
    if (state) {
        return state;
    }
    // If file is empty or invalid JSON, initialize with default
    console.log('State file is empty or invalid. Initializing with default state.');
    const defaultState = require('../.stigmergy-core/templates/state-tmpl.json');
    // Replace placeholder timestamp
    defaultState.history[0].timestamp = new Date().toISOString();
    await fs.writeJson(STATE_FILE_PATH, defaultState, { spaces: 2 });
    return defaultState;
  } catch (e) {
    console.error("Error reading or initializing state file:", e);
    // Return a temporary default state in case of file system errors
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

module.exports = {
  getState,
  updateState,
  appendHistory,
};
