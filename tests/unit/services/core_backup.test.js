import { mock, describe, test, expect, beforeEach } from 'bun:test';
import { vol } from 'memfs';
import path from 'path';
import { homedir } from 'os';
import { CoreBackup } from '../../../services/core_backup.js';
import * as fs from 'fs-extra';

// Mock the dependencies of core_backup.js
mock.module('fs-extra', () => {
    const memfs = require('memfs');
    const { fs } = memfs;

    // We only need to mock the functions that are actually used in core_backup.js
    const fsExtraMock = {
      ...fs,
      pathExists: fs.promises.exists,
      ensureDir: fs.promises.mkdir,
      readdir: fs.promises.readdir,
      remove: fs.promises.rm,
      stat: fs.promises.stat,
      existsSync: fs.existsSync,
      writeFile: fs.promises.writeFile,
      appendFile: fs.promises.appendFile,
      readFile: fs.promises.readFile,
    };

    return {
      __esModule: true,
      default: fsExtraMock,
      vol: memfs.vol,
    };
  });

const execMock = mock();
mock.module('child_process', () => ({
  exec: execMock,
}));


describe("CoreBackup Service", () => {
  let coreBackup;
  const backupDir = path.join(homedir(), ".stigmergy-backups");

  beforeEach(() => {
    vol.reset();
    execMock.mockClear();
    coreBackup = new CoreBackup();
  });

  describe("autoBackup", () => {
    test("should create a backup if .stigmergy-core exists", async () => {
      await vol.fromJSON({ './.stigmergy-core/test.md': 'data' });
      execMock.mockImplementation((command, callback) => callback(null, { stdout: "", stderr: "" }));

      const backupPath = await coreBackup.autoBackup();

      expect(execMock).toHaveBeenCalledWith(expect.stringContaining("tar -czf"), expect.any(Object), expect.any(Function));
      expect(backupPath).toContain(".tar.gz");
    });

    test("should not create a backup if .stigmergy-core does not exist", async () => {
      const backupPath = await coreBackup.autoBackup();
      expect(execMock).not.toHaveBeenCalled();
      expect(backupPath).toBeNull();
    });
  });

  describe("restoreLatest", () => {
    test("should restore the latest backup if one exists", async () => {
        await vol.fromJSON({
            [path.join(backupDir, 'backup-1.tar.gz')]: 'old',
            [path.join(backupDir, 'backup-2.tar.gz')]: 'new',
        });
        execMock.mockImplementation((command, callback) => callback(null, { stdout: "", stderr: "" }));

        const result = await coreBackup.restoreLatest();

        expect(execMock).toHaveBeenCalledWith(expect.stringContaining("tar -xzf"), expect.any(Function));
        expect(execMock.mock.calls[0][0]).toContain("backup-2.tar.gz");
        expect(result).toBe(true);
    });
  });

  describe("verifyBackup", () => {
    test("should return success for a valid-looking backup", async () => {
        const backupPath = path.join(backupDir, 'valid.tar.gz');
        await vol.fromJSON({[backupPath]: 'a'.repeat(2048)});
        execMock.mockImplementation((command, options, callback) => callback(null, { stdout: "", stderr: "" }));

        const result = await coreBackup.verifyBackup(backupPath);
        expect(result.success).toBe(true);
      });

    test("should return failure if backup file is too small", async () => {
        const backupPath = path.join(backupDir, 'small.tar.gz');
        await vol.fromJSON({[backupPath]: 'small'});

        const result = await coreBackup.verifyBackup(backupPath);
        expect(result.success).toBe(false);
        expect(result.error).toBe("Backup file is suspiciously small");
    });

    test("should return failure if tar command fails", async () => {
        const backupPath = path.join(backupDir, 'corrupted.tar.gz');
        await vol.fromJSON({[backupPath]: 'a'.repeat(2048)});
        execMock.mockImplementation((command, options, callback) => callback(new Error("corrupted"), null));

        const result = await coreBackup.verifyBackup(backupPath);
        expect(result.success).toBe(false);
        expect(result.error).toContain("Backup archive appears corrupted");
      });
  });
});