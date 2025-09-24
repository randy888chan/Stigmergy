import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule("fs-extra", () => ({
  default: {
    pathExists: jest.fn(),
    ensureDir: jest.fn(),
    readdir: jest.fn(),
    remove: jest.fn(),
    existsSync: jest.fn(),
    stat: jest.fn(),
  },
}));
jest.unstable_mockModule("child_process", () => ({
  exec: jest.fn(),
}));

describe("CoreBackup Service", () => {
  let CoreBackup;
  let fs;
  let exec;
  let coreBackup;

  beforeEach(async () => {
    // Dynamically import modules to get mocked versions
    CoreBackup = (await import("../../../services/core_backup.js")).CoreBackup;
    fs = (await import("fs-extra")).default;
    exec = (await import("child_process")).exec;

    coreBackup = new CoreBackup();
    jest.clearAllMocks();
  });

  describe("autoBackup", () => {
    test("should create a backup if .stigmergy-core exists", async () => {
      fs.pathExists.mockResolvedValue(true);
      exec.mockImplementation((command, callback) => callback(null, { stdout: "", stderr: "" }));
      fs.readdir.mockResolvedValue([]); // No old backups to clean up

      const backupPath = await coreBackup.autoBackup();

      expect(fs.ensureDir).toHaveBeenCalled();
      expect(exec).toHaveBeenCalledWith(expect.stringContaining("tar -czf"), expect.any(Function));
      expect(backupPath).toContain(".tar.gz");
    });

    test("should not create a backup if .stigmergy-core does not exist", async () => {
      fs.pathExists.mockResolvedValue(false);
      const backupPath = await coreBackup.autoBackup();
      expect(exec).not.toHaveBeenCalled();
      expect(backupPath).toBeNull();
    });
  });

  describe("cleanupOldBackups", () => {
    test("should delete the oldest backups if over the limit", async () => {
        const mockBackups = Array.from({ length: 15 }, (_, i) => `backup-${i}.tar.gz`);
        fs.readdir.mockResolvedValue(mockBackups);

        await coreBackup.cleanupOldBackups();

        // MAX_BACKUPS is 10, so 5 should be deleted
        expect(fs.remove).toHaveBeenCalledTimes(5);
        expect(fs.remove).toHaveBeenCalledWith(expect.stringContaining("backup-0.tar.gz"));
      });

      test("should not delete any backups if at or under the limit", async () => {
        const mockBackups = Array.from({ length: 10 }, (_, i) => `backup-${i}.tar.gz`);
        fs.readdir.mockResolvedValue(mockBackups);

        await coreBackup.cleanupOldBackups();

        expect(fs.remove).not.toHaveBeenCalled();
      });
  });

  describe("restoreLatest", () => {
    test("should restore the latest backup if one exists", async () => {
        fs.readdir.mockResolvedValue(["backup-1.tar.gz", "backup-2.tar.gz"]);
        exec.mockImplementation((command, callback) => callback(null, { stdout: "", stderr: "" }));

        const result = await coreBackup.restoreLatest();

        expect(exec).toHaveBeenCalledWith(expect.stringContaining("tar -xzf"), expect.any(Function));
        expect(exec.mock.calls[0][0]).toContain("backup-2.tar.gz");
        expect(result).toBe(true);
      });

      test("should return false if no backups exist", async () => {
        fs.readdir.mockResolvedValue([]);
        const result = await coreBackup.restoreLatest();
        expect(exec).not.toHaveBeenCalled();
        expect(result).toBe(false);
      });
  });

  describe("verifyBackup", () => {
    test("should return success for a valid-looking backup", async () => {
        fs.existsSync.mockReturnValue(true);
        fs.stat.mockResolvedValue({ size: 2048 });
        exec.mockImplementation((command, callback) => callback(null, { stdout: "", stderr: "" }));

        const result = await coreBackup.verifyBackup("valid.tar.gz");
        expect(result.success).toBe(true);
      });

      test("should return failure if backup file does not exist", async () => {
        fs.existsSync.mockReturnValue(false);
        const result = await coreBackup.verifyBackup("nonexistent.tar.gz");
        expect(result.success).toBe(false);
        expect(result.error).toBe("Backup file does not exist");
      });

      test("should return failure if backup file is too small", async () => {
        fs.existsSync.mockReturnValue(true);
        fs.stat.mockResolvedValue({ size: 100 });
        const result = await coreBackup.verifyBackup("small.tar.gz");
        expect(result.success).toBe(false);
        expect(result.error).toBe("Backup file is suspiciously small");
      });

      test("should return failure if tar command fails", async () => {
        fs.existsSync.mockReturnValue(true);
        fs.stat.mockResolvedValue({ size: 2048 });
        exec.mockImplementation((command, callback) => callback(new Error("corrupted"), null));

        const result = await coreBackup.verifyBackup("corrupted.tar.gz");
        expect(result.success).toBe(false);
        expect(result.error).toContain("Backup archive appears corrupted");
      });

      test("should handle other verification errors", async () => {
        fs.existsSync.mockImplementation(() => { throw new Error("FS error"); });
        const result = await coreBackup.verifyBackup("any.tar.gz");
        expect(result.success).toBe(false);
        expect(result.error).toContain("Backup verification failed");
      });
  });
});
