import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs-extra";
import coreBackup from "../services/core_backup.js";
import { validateAgents } from "../cli/commands/validate.js";

const execPromise = promisify(exec);

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
 * @param {string} args.file_path - Relative path within .stigmergy-core.
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
 * Restores the .stigmergy-core directory from the backup.
 * This is a privileged operation used for testing environments.
 * @returns {Promise<string>} Confirmation message.
 */
export async function restore() {
  console.log("[Core Tools] Guardian is restoring the system from backup...");
  // In the original implementation, this pointed to a specific script.
  // We will replicate the core-backup service's restore logic for consistency.
  const result = await coreBackup.restoreBackup();
  if (result.success) {
    return `Core restored successfully from ${result.backupPath}`;
  }
  throw new Error("Core restore failed.");
}
