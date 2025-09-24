import { mock, describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';
import path from 'path';

// Mock dependencies using the ESM-compatible API
mock.module('../../../engine/neo4j_validator.js', () => ({
  Neo4jValidator: {
    validate: mock(),
  },
}));
mock.module('../../../services/core_backup.js', () => ({
  default: {
    verifyBackup: mock(),
  },
}));
mock.module('fs-extra', () => ({
  default: {
    existsSync: mock(),
    readdir: mock(),
  },
}));
mock.module('os', () => ({
  default: {
    homedir: mock(),
  },
}));

describe('SystemValidator', () => {
  let SystemValidator;
  let Neo4jValidator;
  let coreBackup;
  let fs;
  let os;
  let validator;

  beforeEach(async () => {
    // Import modules after mocking
    SystemValidator = (await import('../../../src/bootstrap/system_validator.js')).SystemValidator;
    Neo4jValidator = (await import('../../../engine/neo4j_validator.js')).Neo4jValidator;
    coreBackup = (await import('../../../services/core_backup.js')).default;
    fs = (await import('fs-extra')).default;
    os = (await import('os')).default;

    // Reset mocks before each test
    Neo4jValidator.validate.mockReset();
    coreBackup.verifyBackup.mockReset();
    fs.existsSync.mockReset();
    fs.readdir.mockReset();
    os.homedir.mockReset();
    
    // Mock os.homedir() for all tests in this suite
    os.homedir.mockReturnValue('/fake/home');

    validator = new SystemValidator();
    
    // Suppress console logs during tests
    spyOn(console, 'log').mockImplementation(() => {});
    spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore spies
    mock.restore();
  });

  describe('comprehensiveCheck', () => {
    it('should return success for all checks when the system is healthy', async () => {
      // Arrange
      Neo4jValidator.validate.mockResolvedValue({ success: true });
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue(['backup1.tar.gz']);
      coreBackup.verifyBackup.mockResolvedValue({ success: true });

      // Act
      const results = await validator.comprehensiveCheck();

      // Assert
      expect(results.core.success).toBe(true);
      expect(results.neo4j.success).toBe(true);
      expect(results.backups.success).toBe(true);
      expect(console.warn).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('✅ System health check passed successfully.');
    });

    it('should return failure and log a warning when a check fails', async () => {
      // Arrange
      Neo4jValidator.validate.mockResolvedValue({ success: false, error: 'DB down' }); // Neo4j fails
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue(['backup1.tar.gz']);
      coreBackup.verifyBackup.mockResolvedValue({ success: true });

      // Act
      const results = await validator.comprehensiveCheck();

      // Assert
      expect(results.backups.success).toBe(true); // Backups should still be successful
      expect(results.neo4j.success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('⚠️ System health check failed.');
    });
  });

  describe('validateCoreIntegrity', () => {
    it('should return success if .stigmergy-core exists', async () => {
      fs.existsSync.mockReturnValue(true);
      const result = await validator.validateCoreIntegrity();
      expect(result.success).toBe(true);
      expect(result.message).toBe('Core integrity verified');
      expect(fs.existsSync).toHaveBeenCalledWith(path.join(process.cwd(), '.stigmergy-core'));
    });

    it('should return failure if .stigmergy-core does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      const result = await validator.validateCoreIntegrity();
      expect(result.success).toBe(false);
      expect(result.error).toBe('.stigmergy-core directory not found.');
    });
  });

  describe('validateBackups', () => {
    const backupDir = '/fake/home/.stigmergy-backups';

    it('should return success if backups are valid', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue(['backup1.tar.gz', 'latest.tar.gz']);
      coreBackup.verifyBackup.mockResolvedValue({ success: true });

      const result = await validator.validateBackups();

      expect(result.success).toBe(true);
      expect(fs.existsSync).toHaveBeenCalledWith(backupDir);
      expect(coreBackup.verifyBackup).toHaveBeenCalledWith(path.join(backupDir, 'latest.tar.gz'));
    });

    it('should return failure if backup directory does not exist', async () => {
      fs.existsSync.mockReturnValue(false);
      const result = await validator.validateBackups();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Backup directory not found.');
    });

    it('should return failure if no backup files are found', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue([]);
      const result = await validator.validateBackups();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No backup files found.');
    });

    it('should return failure if backup verification fails', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue(['backup.tar.gz']);
      coreBackup.verifyBackup.mockResolvedValue({ success: false, error: 'Invalid backup' });

      const result = await validator.validateBackups();

      expect(result).toEqual({ success: false, error: 'Invalid backup' });
    });
    
    it('should handle errors during backup validation', async () => {
      const errorMessage = 'Read error';
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockRejectedValue(new Error(errorMessage));
  
      const result = await validator.validateBackups();
  
      expect(result.success).toBe(false);
      expect(result.error).toContain(`Backup validation failed: ${errorMessage}`);
    });
  });
});
