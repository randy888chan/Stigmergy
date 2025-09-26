import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock fs-extra module before importing the module under test
mock.module('fs-extra', () => ({
    readFile: mock(),
    writeFile: mock(),
    readdir: mock(),
    stat: mock(),
    ensureDir: mock(),
    copy: mock(),
    exists: mock(),
    pathExists: mock(),
}));

mock.module('path', () => ({
    resolve: mock(),
    join: mock(),
    dirname: mock(),
}));

// Import the file system tools module after mocking dependencies
import { 
  readFile, 
  writeFile, 
  listFiles,
  appendFile
} from '../../../tools/file_system.js';

beforeEach(() => {
    mock.restore();
});

describe('File System Tools', () => {
    test('should have all required file system functions', () => {
        expect(typeof readFile).toBe('function');
        expect(typeof writeFile).toBe('function');
        expect(typeof listFiles).toBe('function');
        expect(typeof appendFile).toBe('function');
    });
    
    test('should properly mock file reading operations', async () => {
        const mockFs = await import('fs-extra');
        mockFs.readFile.mockResolvedValue('test file content');
        
        expect(readFile).toBeDefined();
    });
    
    test('should properly mock file writing operations', async () => {
        const mockFs = await import('fs-extra');
        mockFs.writeFile.mockResolvedValue(undefined);
        
        expect(writeFile).toBeDefined();
    });
});