import path from "path";
import fs from "fs-extra";

export class FileStorageAdapter {
  constructor() {
    console.log("FileStorageAdapter initialized.");
  }

  async getState(projectRoot) {
    const stateFile = path.join(projectRoot, '.stigmergy', 'state', 'current.json');
    try {
      if (await fs.pathExists(stateFile)) {
        const state = await fs.readJson(stateFile);
        console.log(`FileStorageAdapter: State loaded from ${stateFile}`);
        return state;
      }
      console.log(`FileStorageAdapter: State file not found at ${stateFile}. Returning null.`);
      return null;
    } catch (error) {
      console.error(`FileStorageAdapter: Error reading state from file ${stateFile}:`, error.message);
      return null;
    }
  }

  async updateState(projectRoot, state) {
    const stateDir = path.join(projectRoot, '.stigmergy', 'state');
    const stateFile = path.join(stateDir, 'current.json');
    try {
      await fs.ensureDir(stateDir);
      await fs.writeJson(stateFile, state, { spaces: 2 });
      console.log(`FileStorageAdapter: State written to file: ${stateFile}`);
    } catch (error) {
      console.error(`FileStorageAdapter: Error writing state to file ${stateFile}:`, error.message);
    }
  }
}
