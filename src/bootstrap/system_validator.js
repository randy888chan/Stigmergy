import "dotenv/config";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { Neo4jValidator } from "../../engine/neo4j_validator.js";
import coreBackup from "../../services/core_backup.js";

/**
 * Validates the health of the entire Stigmergy system.
 */
export class SystemValidator {
  constructor() {
    this.results = {};
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
    if (!fs.existsSync(corePath)) {
      return { success: false, error: ".stigmergy-core directory not found." };
    }
    return { success: true, message: "Core integrity verified" };
  }

  async validateGovernance() {
    const governancePath = path.join(process.cwd(), ".stigmergy-core", "governance");
    if (!fs.existsSync(governancePath)) {
      return { success: false, error: ".stigmergy-core/governance directory not found." };
    }
    
    const constitutionPath = path.join(governancePath, "constitution.md");
    if (!fs.existsSync(constitutionPath)) {
      return { success: false, error: "Constitution file not found in governance directory." };
    }
    
    return { success: true, message: "Governance structure verified" };
  }

  async validateBackups() {
    try {
      const backupDir = path.join(os.homedir(), ".stigmergy-backups");
      if (!fs.existsSync(backupDir)) {
        return { success: false, error: "Backup directory not found." };
      }
      const backups = await fs.readdir(backupDir);
      if (backups.length === 0) {
        return { success: false, error: "No backup files found." };
      }
      const latestBackup = path.join(backupDir, backups[backups.length - 1]);
      const verification = await coreBackup.verifyBackup(latestBackup);
      return verification;
    } catch (error) {
      return { success: false, error: "Backup validation failed: " + error.message };
    }
  }
}