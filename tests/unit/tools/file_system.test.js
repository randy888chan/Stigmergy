import { jest, describe, it, expect, beforeEach } from 'bun:test';
import path from 'path';
import { resolvePath } from '../../../tools/file_system.js';

describe('resolvePath', () => {
  let mockFs;

  beforeEach(() => {
    mockFs = {
      statSync: jest.fn(),
    };
  });

  it('should resolve a safe path correctly', () => {
    const safePath = 'src/components/button.js';
    mockFs.statSync.mockReturnValue({ size: 100 });
    const resolved = resolvePath(safePath, mockFs);
    expect(resolved).toBe(path.resolve(process.cwd(), safePath));
  });

  it('should throw an error for a path traversal attempt', () => {
    const unsafePath = '../sensitive-data.txt';
    expect(() => resolvePath(unsafePath, mockFs)).toThrow('Security violation: Path traversal attempt');
  });

  it('should throw an error for a path outside the safe directories', () => {
    const unsafePath = 'node_modules/some-package/index.js';
    expect(() => resolvePath(unsafePath, mockFs)).toThrow('Access restricted to node_modules directory');
  });

  it('should throw an error if the file path is invalid', () => {
    expect(() => resolvePath(null, mockFs)).toThrow('Invalid file path provided');
  });

  it('should throw an error for files exceeding the size limit', () => {
    const filePath = 'src/large-file.txt';
    mockFs.statSync.mockReturnValue({ size: 2 * 1024 * 1024 });

    expect(() => resolvePath(filePath, mockFs)).toThrow('File exceeds size limit of 1MB');
  });

  it('should allow files under the size limit', () => {
    const filePath = 'src/allowed-file.txt';
    mockFs.statSync.mockReturnValue({ size: 0.5 * 1024 * 1024 });

    expect(() => resolvePath(filePath, mockFs)).not.toThrow();
  });

  it('should skip size check if file does not exist yet', () => {
    const filePath = 'src/new-file.txt';
    mockFs.statSync.mockImplementation(() => {
      throw new Error('ENOENT: no such file or directory');
    });

    expect(() => resolvePath(filePath, mockFs)).not.toThrow();
    expect(mockFs.statSync).toHaveBeenCalledTimes(1);
  });
});
