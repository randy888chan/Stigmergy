import { resolvePath } from '../../../tools/file_system.js';
import path from 'path';
import fs from 'fs-extra';
import config from '../../../stigmergy.config.js';

// Mock fs.statSync to control file size checks
jest.mock('fs-extra', () => ({
  ...jest.requireActual('fs-extra'),
  statSync: jest.fn(),
}));

describe('resolvePath', () => {
  const originalConfig = { ...config };

  beforeEach(() => {
    // Reset the config and mocks before each test
    config.security = originalConfig.security || {};
    fs.statSync.mockClear();
  });

  it('should resolve a safe path correctly', () => {
    const safePath = 'src/components/button.js';
    const resolved = resolvePath(safePath);
    expect(resolved).toBe(path.resolve(process.cwd(), safePath));
  });

  it('should throw an error for a path traversal attempt', () => {
    const unsafePath = '../sensitive-data.txt';
    expect(() => resolvePath(unsafePath)).toThrow('Security violation: Path traversal attempt');
  });

  it('should throw an error for an absolute path', () => {
    const unsafePath = path.resolve(process.cwd(), '../some-other-project/file.js');
    // We test the relative path calculation leading to an absolute-like structure
    const relativeUnsafe = path.relative(process.cwd(), unsafePath);
    expect(() => resolvePath(relativeUnsafe)).toThrow('Security violation: Path traversal attempt');
  });

  it('should throw an error for a path outside the safe directories', () => {
    const unsafePath = 'node_modules/some-package/index.js';
    expect(() => resolvePath(unsafePath)).toThrow('Access restricted to node_modules directory');
  });

  it('should throw an error if the file path is invalid', () => {
    expect(() => resolvePath(null)).toThrow('Invalid file path provided');
    expect(() => resolvePath(undefined)).toThrow('Invalid file path provided');
    expect(() => resolvePath(123)).toThrow('Invalid file path provided');
  });

  describe('File Size Limit', () => {
    beforeEach(() => {
        config.security = { ...config.security, maxFileSizeMB: 1 };
    });

    it('should allow files under the size limit', () => {
        const filePath = 'src/allowed-file.txt';
        // Simulate a file size of 0.5 MB
        fs.statSync.mockReturnValue({ size: 0.5 * 1024 * 1024 });
        expect(() => resolvePath(filePath)).not.toThrow();
      });
  
      it('should throw an error for files exceeding the size limit', () => {
        const filePath = 'src/large-file.txt';
        // Simulate a file size of 2 MB
        fs.statSync.mockReturnValue({ size: 2 * 1024 * 1024 });
        expect(() => resolvePath(filePath)).toThrow('File exceeds size limit of 1MB');
      });

      it('should skip size check if file does not exist yet', () => {
        const filePath = 'src/new-file.txt';
        // Simulate fs.statSync throwing an error (e.g., file not found)
        fs.statSync.mockImplementation(() => {
          throw new Error('File not found');
        });
        expect(() => resolvePath(filePath)).not.toThrow();
      });
  });
});
