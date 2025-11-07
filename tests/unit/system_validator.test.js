import { describe, it, expect, beforeEach, afterAll, mock, spyOn } from "bun:test";
import fs from "fs-extra";
import path from "path";
import os from "os";
let SystemValidator;

// Mock dependencies that are not the focus of this test
const mockVerifyBackup = mock();
const mockNeo4jValidate = mock();

mock.module("../../services/core_backup.js", () => ({
  CoreBackup: class {
    verifyBackup = mockVerifyBackup;
  },
}));

mock.module("../../engine/neo4j_validator.js", () => ({
  Neo4jValidator: {
    validate: mockNeo4jValidate,
  },
}));

describe("SystemValidator", () => {
  let validator;

  beforeEach(async () => {
    mockVerifyBackup.mockReset();
    mockNeo4jValidate.mockReset();
    mock.restore(); // Restore all spies before each test
    // Dynamically import to ensure mocks and env vars are set
    SystemValidator = (await import("../../src/bootstrap/system_validator.js")).SystemValidator;
    validator = new SystemValidator(fs, os);
  });

  afterAll(() => {
    mock.restore();
  });

  it("should run comprehensiveCheck and report success when all checks pass", async () => {
    // Setup for happy path for ALL checks
    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue(['backup.tar.gz']);
    spyOn(fs, 'statSync').mockReturnValue({ mtime: new Date() });
    mockVerifyBackup.mockResolvedValue({ success: true });
    mockNeo4jValidate.mockResolvedValue({ success: true });

    const results = await validator.comprehensiveCheck();

    expect(results.core.success).toBe(true);
    expect(results.neo4j.success).toBe(true);
    expect(results.backups.success).toBe(true);
    expect(results.governance.success).toBe(true);
  });

  it("validateBackups should return success when backups are valid", async () => {
    // Setup for happy path
    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue(['backup.tar.gz']);
    spyOn(fs, 'statSync').mockReturnValue({ mtime: new Date() });
    mockVerifyBackup.mockResolvedValue({ success: true });

    const result = await validator.validateBackups();
    expect(result.success).toBe(true);
    expect(mockVerifyBackup).toHaveBeenCalled();
  });

  it("validateBackups should return an error if the backup directory does not exist", async () => {
    // Force the condition for this test
    spyOn(fs, 'existsSync').mockReturnValue(false);

    const result = await validator.validateBackups();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Backup directory not found.");
    expect(mockVerifyBackup).not.toHaveBeenCalled();
  });

  it("validateBackups should return an error if there are no backup files", async () => {
    // Force the conditions for this test
    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue([]);

    const result = await validator.validateBackups();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No backup files found.");
    expect(mockVerifyBackup).not.toHaveBeenCalled();
  });

  it("comprehensiveCheck should report failure if any check fails", async () => {
    // Setup for happy path for other checks
    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue(['backup.tar.gz']);
    mockNeo4jValidate.mockResolvedValue({ success: true });

    // Make the backup verification itself fail
    mockVerifyBackup.mockResolvedValue({ success: false, error: "Backup corrupted" });

    const results = await validator.comprehensiveCheck();
    expect(results.backups.success).toBe(false);

    const hasFailures = Object.values(results).some((r) => !r.success);
    expect(hasFailures).toBe(true);
  });

  it("validateBackups should validate the most recent backup file", async () => {
    const backupDir = path.join(os.homedir(), ".stigmergy-backups");
    const backupFiles = ["backup-2023-01-01.tar.gz", "backup-2023-01-03.tar.gz", "backup-2023-01-02.tar.gz"];
    const latestBackupFile = "backup-2023-01-03.tar.gz";
    const latestBackupPath = path.join(backupDir, latestBackupFile);

    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue(backupFiles);
    spyOn(fs, 'statSync').mockImplementation((filePath) => {
      const fileName = path.basename(filePath);
      if (fileName === "backup-2023-01-01.tar.gz") return { mtime: new Date("2023-01-01") };
      if (fileName === "backup-2023-01-02.tar.gz") return { mtime: new Date("2023-01-02") };
      if (fileName === "backup-2023-01-03.tar.gz") return { mtime: new Date("2023-01-03") };
      return { mtime: new Date(0) }; // Default for any other statSync calls
    });
    mockVerifyBackup.mockResolvedValue({ success: true });

    const result = await validator.validateBackups();

    expect(result.success).toBe(true);
    expect(mockVerifyBackup).toHaveBeenCalledWith(latestBackupPath);
  });
});