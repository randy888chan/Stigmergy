import fs from "fs-extra";
import path from "path";
import coreBackup from "../services/core_backup.js";
import { validateAgents } from "../cli/commands/validate.js";

// ===================================================================
// == Guardian Tools (@guardian) - High Privilege, System Modifying ==
// ===================================================================

/**
 * Creates a new backup of the .stigmergy-core directory.
 * @returns {Promise<string>} Confirmation message.
 */
export async function backup() {
  console.log("[Core Tools] Guardian is creating a system backup...");
  const backupPath = await coreBackup.autoBackup();
  if (backupPath) {
    return `Core backup created successfully at ${backupPath}`;
  }
  throw new Error("Core backup failed.");
}

/**
 * Validates the integrity of all agent definitions in the core.
 * @returns {Promise<string>} Confirmation or error message.
 */
export async function validate() {
  console.log("[Core Tools] Guardian is validating system integrity...");
  const result = await validateAgents();
  if (result.success) {
    return "Core agent validation passed successfully.";
  }
  throw new Error(`Core validation failed: ${result.error}`);
}

/**
 * Applies a patch (writes content) to a file within the .stigmergy-core.
 * This is a highly privileged operation.
 * @param {object} args
 * @param {string} args.filePath - Relative path within .stigmergy-core.
 * @param {string} args.content - The new content for the file.
 * @returns {Promise<string>} Confirmation message.
 */
export async function applyPatch({ filePath, content }) {
  console.log(`[Core Tools] Guardian is applying a patch to: ${filePath}`);
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  const safePath = path.join(corePath, filePath);

  // Security Check: Ensure the path is genuinely inside the core.
  if (!safePath.startsWith(corePath)) {
      throw new Error(`Security violation: Path traversal attempt on core file system: ${filePath}`);
  }

  await fs.writeFile(safePath, content);
  return `Patch applied successfully to ${filePath}.`;
}

/**
 * Restores the .stigmergy-core from the latest backup.
 * @returns {Promise<string>} Confirmation message.
 */
export async function restore() {
    if (await coreBackup.restoreLatest()) {
        return "Core restored successfully from latest backup.";
    }
    throw new Error("Core restore failed.");
}

// System Control Tools (Factory)
export function createSystemControlTools(engine) {
  return {
    start_project: async ({ goal }) => {
      await engine.stateManager.initializeProject(goal);
      engine.start(); // This won't re-run the server, just the loop
      return `Project initialized with goal: "${goal}". Engine loop is active.`;
    },
    pause_engine: async () => {
      await engine.stop("Paused by user command.");
      return "Stigmergy engine loop has been paused.";
    },
    resume_engine: async () => {
      engine.start();
      return "Stigmergy engine loop is resuming.";
    },
    get_status: async () => {
      const state = await engine.stateManager.getState();
      return `Current project status: ${state.project_status}`;
    },
  };
}