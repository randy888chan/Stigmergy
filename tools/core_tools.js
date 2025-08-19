import fs from "fs-extra";
import path from "path";
import coreBackup from "../services/core_backup.js";
import { validateAgents } from "../cli/commands/validate.js";

export async function backup() {
  const backupPath = await coreBackup.autoBackup();
  if (backupPath) return `Core backup created: ${backupPath}`;
  throw new Error("Core backup failed.");
}

export async function validate() {
  const result = await validateAgents();
  if (result.success) return "Core agent validation passed.";
  throw new Error(`Core validation failed: ${result.error}`);
}

export async function applyPatch({ filePath, content }) {
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  const safePath = path.join(corePath, filePath);
  if (!safePath.startsWith(corePath)) {
    throw new Error(`Security violation: Path traversal.`);
  }
  await fs.writeFile(safePath, content);
  return `Patch applied successfully to ${filePath}.`;
}

export async function restore() {
    if (await coreBackup.restoreLatest()) {
        return "Core restored successfully from latest backup.";
    }
    throw new Error("Core restore failed.");
}
