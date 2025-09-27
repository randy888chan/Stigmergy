import { describe, it, expect, beforeEach, mock } from "bun:test";

// 1. Create mock functions that are in scope for the whole file
const mockVerifyBackup = mock(() => Promise.resolve({ success: true }));
const mockNeo4jValidate = mock(() => Promise.resolve({ success: true }));
const mockFsExistsSync = mock(() => true);
const mockFsReadDir = mock(() => Promise.resolve(["backup1.tar.gz"]));

// 2. Mock the modules and use the functions from step 1
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

// fs-extra is a CJS module, so mocking the default export is key.
mock.module("fs-extra", () => ({
  default: {
    existsSync: mockFsExistsSync,
    readdir: mockFsReadDir,
  },
}));

// 3. Now that mocks are set up, import the system under test
import { SystemValidator } from "../../src/bootstrap/system_validator.js";

describe("SystemValidator", () => {
  let validator;

  beforeEach(() => {
    // 4. Reset mocks before each test using the handles from step 1
    mockVerifyBackup.mockClear();
    mockNeo4jValidate.mockClear();
    mockFsExistsSync.mockClear();
    mockFsReadDir.mockClear();

    // Set default behaviors for a "happy path" test
    mockFsExistsSync.mockReturnValue(true);
    mockFsReadDir.mockResolvedValue(["backup1.tar.gz"]);
    mockVerifyBackup.mockResolvedValue({ success: true });
    mockNeo4jValidate.mockResolvedValue({ success: true });

    // Instantiate the validator
    validator = new SystemValidator();
  });

  it("should run comprehensiveCheck and report success when all checks pass", async () => {
    const results = await validator.comprehensiveCheck();
    expect(results.core.success).toBe(true);
    expect(results.neo4j.success).toBe(true);
    expect(results.backups.success).toBe(true);
    expect(results.governance.success).toBe(true);
  });

  it("validateBackups should return success when backups are valid", async () => {
    const result = await validator.validateBackups();
    expect(result.success).toBe(true);
    expect(mockVerifyBackup).toHaveBeenCalled();
  });

  it("validateBackups should return an error if the backup directory does not exist", async () => {
    // Override the default mock behavior for this specific test
    mockFsExistsSync.mockReturnValueOnce(false);
    const result = await validator.validateBackups();
    expect(result.success).toBe(false);
    expect(result.error).toBe("Backup directory not found.");
  });

  it("validateBackups should return an error if there are no backup files", async () => {
    mockFsReadDir.mockResolvedValue([]);
    const result = await validator.validateBackups();
    expect(result.success).toBe(false);
    expect(result.error).toBe("No backup files found.");
  });

  it("comprehensiveCheck should report failure if any check fails", async () => {
    // Make the backup check fail
    mockVerifyBackup.mockResolvedValue({ success: false, error: "Backup corrupted" });

    const results = await validator.comprehensiveCheck();
    expect(results.backups.success).toBe(false);

    const hasFailures = Object.values(results).some((r) => !r.success);
    expect(hasFailures).toBe(true);
  });
});