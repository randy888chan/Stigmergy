import fs from "fs-extra";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
const MAX_BACKUPS = 10;

export class CoreBackup {
  constructor() {
    this.backupDir = path.join(process.env.HOME, ".stigmergy-backups");
  }

  async autoBackup() {
    const corePath = path.join(process.cwd(), ".stigmergy-core");
    if (!(await fs.pathExists(corePath))) return null;
    await fs.ensureDir(this.backupDir);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFileName = `stigmergy-backup-${timestamp}.tar.gz`;
    const backupPath = path.join(this.backupDir, backupFileName);
    await execPromise(`tar -czf "${backupPath}" -C "${process.cwd()}" .stigmergy-core`);
    await this.cleanupOldBackups();
    return backupPath;
  }

  async cleanupOldBackups() {
    await fs.ensureDir(this.backupDir);
    const backups = (await fs.readdir(this.backupDir)).filter((f) => f.endsWith(".tar.gz"));
    if (backups.length <= MAX_BACKUPS) return;

    const sorted = backups.sort();

    const toDelete = sorted.slice(0, backups.length - MAX_BACKUPS);
    for (const backup of toDelete) {
      await fs.remove(path.join(this.backupDir, backup));
    }
  }

  async restoreLatest() {
    const backups = (await fs.readdir(this.backupDir)).filter(f => f.endsWith(".tar.gz")).sort();
    if (backups.length === 0) return false;
    const latest = path.join(this.backupDir, backups[backups.length - 1]);
    await execPromise(`tar -xzf "${latest}" -C "${process.cwd()}"`);
    return true;
  }

  async verifyBackup(backupPath) {
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
}

// The service is now exported as a class, and consumers will instantiate it.
