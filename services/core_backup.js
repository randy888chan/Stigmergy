import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

const MAX_BACKUPS = 10; // Keep last 10 backups

export class CoreBackup {
  constructor() {
    this.backupDir = path.join(process.env.HOME, ".stigmergy-backups");
  }

  async createBackup() {
    const corePath = path.join(process.cwd(), ".stigmergy-core");
    if (!(await fs.pathExists(corePath))) return;

    await fs.ensureDir(this.backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `stigmergy-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);

    try {
      await execPromise(`tar -czf "${backupPath}" -C "${process.cwd()}" .stigmergy-core`);
      console.log(`Backup created at ${backupPath}`);
      return backupPath;
    } catch (error) {
      console.error(`Error creating backup: ${error.message}`);
      return null;
    }
  }

  async autoBackup() {
    const backupPath = await this.createBackup();
    if (backupPath) {
      await this.cleanupOldBackups();
    }
    return backupPath;
  }

  async cleanupOldBackups() {
    const backups = (await fs.readdir(this.backupDir)).filter((f) => f.endsWith(".tar.gz"));
    if (backups.length <= MAX_BACKUPS) return;

    const sorted = backups.sort();

    const toDelete = sorted.slice(0, backups.length - MAX_BACKUPS);
    for (const backup of toDelete) {
      await fs.remove(path.join(this.backupDir, backup));
    }
  }

  async restoreLatest() {
    const backups = (await fs.readdir(this.backupDir)).filter((f) => f.endsWith(".tar.gz"));
    if (backups.length === 0) return false;

    const sorted = backups.sort();
    const latest = path.join(this.backupDir, sorted[sorted.length - 1]);
    const corePath = path.join(process.cwd(), ".stigmergy-core");

    try {
      await fs.remove(corePath);
      await execPromise(`tar -xzf "${latest}" -C "${process.cwd()}"`);
      console.log(`Restored from ${latest}`);
      return true;
    } catch (error) {
      console.error(`Error restoring backup: ${error.message}`);
      return false;
    }
  }
}

export async function verifyBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: "Backup file does not exist" };
    }

    const fileStats = await fs.stat(backupPath);
    if (fileStats.size < 1024) {
      // Too small to be valid
      return { success: false, error: "Backup file is suspiciously small" };
    }

    try {
      await execPromise(`tar -tzf "${backupPath}" .stigmergy-core/system_docs/00_System_Goal.md`);
      return { success: true };
    } catch (e) {
      return {
        success: false,
        error: "Backup archive appears corrupted: " + e.message,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: "Backup verification failed: " + error.message,
    };
  }
}

const coreBackup = new CoreBackup();
export default coreBackup;
