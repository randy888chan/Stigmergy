import "dotenv/config";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { Neo4jValidator } from "../../engine/neo4j_validator.js";
import { CoreBackup } from "../../services/core_backup.js";

/**
 * Validates the health of the entire Stigmergy system.
 */
export class SystemValidator {
  constructor(fsOverride = fs, osOverride = os) {
    this.results = {};
    this.coreBackup = new CoreBackup();
    this.fs = fsOverride;
    this.os = osOverride;
  }

  async comprehensiveCheck() {
    console.log("--- Starting Comprehensive System Health Check ---");
    this.results = {
      core: await this.validateCoreIntegrity(),
      neo4j: await Neo4jValidator.validate(),
      backups: await this.validateBackups(),
      governance: await this.validateGovernance(),
    };
    const hasFailures = Object.values(this.results).some((r) => !r.success);
    if (hasFailures) {
      console.warn("⚠️ System health check failed.");
    } else {
      console.log("✅ System health check passed successfully.");
    }
    return this.results;
  }

  async validateCoreIntegrity() {
    const corePath = path.join(process.cwd(), ".stigmergy-core");
    if (!this.fs.existsSync(corePath)) {
      return { success: false, error: ".stigmergy-core directory not found." };
    }
    return { success: true, message: "Core integrity verified" };
  }

  async validateGovernance() {
    const governancePath = path.join(process.cwd(), ".stigmergy-core", "governance");
    if (!this.fs.existsSync(governancePath)) {
      return { success: false, error: ".stigmergy-core/governance directory not found." };
    }
    
    const constitutionPath = path.join(governancePath, "constitution.md");
    if (!this.fs.existsSync(constitutionPath)) {
      return { success: false, error: "Constitution file not found in governance directory." };
    }
    
    return { success: true, message: "Governance structure verified" };
  }

  async validateBackups() {
    try {
      const backupDir = path.join(this.os.homedir(), ".stigmergy-backups");
      if (!this.fs.existsSync(backupDir)) {
        return { success: false, error: "Backup directory not found." };
      }
      const backupFiles = await this.fs.readdir(backupDir);
      if (backupFiles.length === 0) {
        return { success: false, error: "No backup files found." };
      }

      const latestBackupFile = backupFiles
        .map((file) => ({
          file,
          mtime: this.fs.statSync(path.join(backupDir, file)).mtime,
        }))
        .sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0].file;

      const latestBackup = path.join(backupDir, latestBackupFile);
      const verification = await this.coreBackup.verifyBackup(latestBackup);
      return verification;
    } catch (error) {
      return { success: false, error: "Backup validation failed: " + error.message };
    }
  }
}