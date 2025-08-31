import { SystemValidator } from '../../../src/bootstrap/system_validator.js';
import { Neo4jValidator } from '../../../engine/neo4j_validator.js';
import coreBackup from '../../../services/core_backup.js';
import fs from 'fs-extra';
import os from 'os';
import path from 'path';

// Mock dependencies
jest.mock('../../../engine/neo4j_validator.js');
jest.mock('../../../services/core_backup.js', () => ({
  __esModule: true,
  default: {
    verifyBackup: jest.fn(),
  },
}));
jest.mock('fs-extra');
jest.mock('os');

describe('SystemValidator', () => {
  let validator;

  beforeEach(() => {
    // Clear all mocks before each test to ensure a clean state
    jest.clearAllMocks();
    
    // Mock os.homedir() for all tests in this suite
    os.homedir.mockReturnValue('/fake/home');

    validator = new SystemValidator();
    
    // Suppress console logs during tests
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
