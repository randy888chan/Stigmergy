import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const MAX_BACKUPS = 10; // Keep last 10 backups

export class CoreBackup {
  constructor() {
    this.backupDir = path.join(process.cwd(), ".stigmergy-backups");
  }

  async createBackup() {
    const corePath = path.join(process.cwd(), ".stigmergy-core");
    if (!(await fs.pathExists(corePath))) return;

    await fs.ensureDir(this.backupDir);
    const backupId = `backup-${uuidv4()}`;
    const backupPath = path.join(this.backupDir, backupId);

    await fs.copy(corePath, backupPath);
    return backupPath;
  }

  async autoBackup() {
    const backupPath = await this.createBackup();
    await this.cleanupOldBackups();
    return backupPath;
  }

  async cleanupOldBackups() {
    const backups = await fs.readdir(this.backupDir);
    if (backups.length <= MAX_BACKUPS) return;

    const sorted = backups.sort(
      (a, b) =>
        fs.statSync(path.join(this.backupDir, a)).mtimeMs -
        fs.statSync(path.join(this.backupDir, b)).mtimeMs
    );

    const toDelete = sorted.slice(0, backups.length - MAX_BACKUPS);
    for (const backup of toDelete) {
      await fs.remove(path.join(this.backupDir, backup));
    }
  }

  async restoreLatest() {
    const backups = await fs.readdir(this.backupDir);
    if (backups.length === 0) return false;

    const sorted = backups.sort(
      (a, b) =>
        fs.statSync(path.join(this.backupDir, b)).mtimeMs -
        fs.statSync(path.join(this.backupDir, a)).mtimeMs
    );

    const latest = path.join(this.backupDir, sorted[0]);
    await fs.copy(latest, path.join(process.cwd(), ".stigmergy-core"));
    return true;
  }
}

export default new CoreBackup();
