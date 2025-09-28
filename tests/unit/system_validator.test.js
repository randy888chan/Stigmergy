import { describe, it, expect, beforeEach, afterAll, mock, spyOn } from "bun:test";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { SystemValidator } from "../../src/bootstrap/system_validator.js";

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

  beforeEach(() => {
    mockVerifyBackup.mockReset();
    mockNeo4jValidate.mockReset();
    mock.restore(); // Restore all spies before each test
    validator = new SystemValidator();
  });

  afterAll(() => {
    mock.restore();
  });

  it("should run comprehensiveCheck and report success when all checks pass", async () => {
    // Setup for happy path for ALL checks
    spyOn(fs, 'existsSync').mockReturnValue(true);
    spyOn(fs, 'readdir').mockResolvedValue(['backup.tar.gz']);
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
});