import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import path from 'path';

// Mock the 'fs-extra' module BEFORE any imports
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    existsSync: jest.fn(),
    statSync: jest.fn(),
  },
}));

describe('resolvePath', () => {
  let fs;
  let resolvePath;
  let config;

  beforeEach(async () => {
    // Import the mocked fs-extra and the module to test inside beforeEach
    // This ensures tests are isolated
    fs = (await import('fs-extra')).default;
    const fileSystemModule = await import('../../../tools/file_system.js');
    resolvePath = fileSystemModule.resolvePath;
    config = (await import('../../../stigmergy.config.js')).default;

    // Reset mocks before each test
    fs.existsSync.mockReset();
    fs.statSync.mockReset();
  });

  it('should resolve a safe path correctly', () => {
    const safePath = 'src/components/button.js';
    // The file needs to "exist" for the size check to be attempted, but we'll mock the size check away
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 100 }); // Mock a small file size
    const resolved = resolvePath(safePath);
    expect(resolved).toBe(path.resolve(process.cwd(), safePath));
  });

  it('should throw an error for a path traversal attempt', () => {
    const unsafePath = '../sensitive-data.txt';
    expect(() => resolvePath(unsafePath)).toThrow('Security violation: Path traversal attempt');
  });

  it('should throw an error for a path outside the safe directories', () => {
    const unsafePath = 'node_modules/some-package/index.js';
    expect(() => resolvePath(unsafePath)).toThrow('Access restricted to node_modules directory');
  });

  it('should throw an error if the file path is invalid', () => {
    expect(() => resolvePath(null)).toThrow('Invalid file path provided');
  });

  it('should throw an error for files exceeding the size limit', () => {
    const filePath = 'src/large-file.txt';
    fs.existsSync.mockReturnValue(true); // The file must exist to be checked
    fs.statSync.mockReturnValue({ size: 2 * 1024 * 1024 }); // Mock size > 1MB

    // We don't need to mock the config, resolvePath should use the imported one
    expect(() => resolvePath(filePath)).toThrow('File exceeds size limit of 1MB');
  });

  it('should allow files under the size limit', () => {
    const filePath = 'src/allowed-file.txt';
    fs.existsSync.mockReturnValue(true);
    fs.statSync.mockReturnValue({ size: 0.5 * 1024 * 1024 }); // Mock size < 1MB

    expect(() => resolvePath(filePath)).not.toThrow();
  });

  it('should skip size check if file does not exist yet', () => {
    const filePath = 'src/new-file.txt';
    // To simulate a file not existing, we make statSync throw, which is what the real fs.statSync does.
    fs.statSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    // The function should catch this error and not throw its own error.
    expect(() => resolvePath(filePath)).not.toThrow();

    // We also expect that statSync was called once.
    expect(fs.statSync).toHaveBeenCalledTimes(1);
  });
});
