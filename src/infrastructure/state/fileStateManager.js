import fs from "fs-extra";
import path from "path";
import { EventEmitter } from "events";
import crypto from "crypto";

export class FileStateManager extends EventEmitter {
  constructor() {
    super();
    this.stateDir = path.join(process.cwd(), ".ai", "state");
    this.currentStateFile = path.join(this.stateDir, "current.json");
    this.eventsFile = path.join(this.stateDir, "events.jsonl");
    this.lockFile = path.join(this.stateDir, ".lock");

    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.ensureDir(this.stateDir);
  }

  async updateState(event) {
    const lock = await this.acquireLock();
    try {
      // Append event to event log
      await fs.appendFile(
        this.eventsFile,
        JSON.stringify({
          ...event,
          timestamp: Date.now(),
          id: crypto.randomUUID(),
        }) + "\n"
      );

      // Calculate new state
      const newState = await this.projectState(event);

      // Write atomic state update
      const tempFile = `${this.currentStateFile}.tmp`;
      await fs.writeJson(tempFile, newState, { spaces: 2 });
      await fs.move(tempFile, this.currentStateFile, { overwrite: true });

      this.emit("stateChanged", newState);
      return newState;
    } finally {
      await this.releaseLock(lock);
    }
  }

  async acquireLock() {
    const lockId = crypto.randomUUID();
    const lockPath = `${this.lockFile}.${lockId}`;

    try {
      await fs.writeFile(lockPath, process.pid.toString(), { flag: "wx" });
      return lockId;
    } catch (error) {
      if (error.code === "EEXIST") {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return this.acquireLock();
      }
      throw error;
    }
  }

  async releaseLock(lockId) {
    await fs.remove(`${this.lockFile}.${lockId}`);
  }

  async getState() {
    try {
      return await fs.readJson(this.currentStateFile);
    } catch {
      return this.getDefaultState();
    }
  }

  getDefaultState() {
    return {
      schema_version: "3.1",
      project_name: "New Stigmergy Project",
      project_status: "NEEDS_INITIALIZATION",
      project_manifest: { tasks: [] },
      history: [],
    };
  }

  async subscribeToChanges(callback) {
    this.on("stateChanged", callback);
  }

  async projectState(event) {
    const currentState = await this.getState();

    switch (event.type) {
      case "AGENT_COMPLETED":
        return {
          ...currentState,
          project_status: event.newStatus || currentState.project_status,
          lastUpdated: Date.now(),
        };

      case "TASK_FAILED":
        return {
          ...currentState,
          project_status: "EXECUTION_FAILED",
          failureReason: event.reason,
          lastUpdated: Date.now(),
        };

      default:
        return { ...currentState, ...event, lastUpdated: Date.now() };
    }
  }
}
