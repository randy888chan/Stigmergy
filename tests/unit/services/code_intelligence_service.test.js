import { test, expect, describe, mock, afterEach, beforeEach } from 'bun:test';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';
import fs from 'fs-extra';
import path from 'path';

// Mock fs-extra to control file system operations in tests
mock.module('fs-extra', () => ({
  default: {
    readdir: mock(() => Promise.resolve([])),
    stat: mock(() => Promise.resolve({ isDirectory: () => false, isFile: () => true })),
    // Add other fs-extra functions if needed by the service
  },
}));

describe('CodeIntelligenceService._walkDirectory', () => {
  let service;
  let mockedFs;

  beforeEach(() => {
    // Re-import the mocked module before each test to reset mocks
    mock.module('fs-extra', () => ({
        default: {
            readdir: mock(() => Promise.resolve([])),
            stat: mock(() => Promise.resolve({ isDirectory: () => false, isFile: () => true })),
        }
    }));
    // We need to dynamically re-import fs for the mocks to apply correctly in the test scope
    import('fs-extra').then(fsModule => {
      mockedFs = fsModule.default;
    });
    service = new CodeIntelligenceService();
  });

  afterEach(() => {
    // Reset all mocks after each test
    mock.restore();
  });

  test('should correctly filter files by extension, including dot', async () => {
    // Arrange
    const testDir = 'test-dir';
    const filesInDir = ['file1.js', 'file2.ts', 'file3js', 'file4.jsx', 'another.JS'];
    const extensionsToFind = ['js', 'jsx'];

    // Mock readdir to return our list of files
    const readdirMock = mock.module('fs-extra', () => ({
        default: {
            readdir: mock(async (dirPath) => {
                if (dirPath === testDir) {
                    return filesInDir;
                }
                return [];
            }),
            stat: mock(async (filePath) => ({
                isDirectory: () => false,
                isFile: () => true,
            })),
        }
    }));

    // Re-initialize service with new mocks
    const { CodeIntelligenceService: newCIS } = await import('../../../services/code_intelligence_service.js');
    service = new newCIS();

    // Act
    const foundFiles = await service._walkDirectory(testDir, extensionsToFind);

    // Assert
    // It should find 'file1.js' and 'file4.jsx'
    // It should NOT find 'file3js' (no dot) or 'file2.ts' (wrong extension)
    // It should NOT find 'another.JS' because the current implementation is case-sensitive.
    expect(foundFiles).toHaveLength(2);
    expect(foundFiles).toContain(path.join(testDir, 'file1.js'));
    expect(foundFiles).toContain(path.join(testDir, 'file4.jsx'));
    expect(foundFiles).not.toContain(path.join(testDir, 'file3js'));
    expect(foundFiles).not.toContain(path.join(testDir, 'file2.ts'));
  });

  test('should return all files when extensions argument is null', async () => {
    // Arrange
    const testDir = 'another-test-dir';
    const filesInDir = ['file1.js', 'document.txt', 'image.png'];

    const readdirMock = mock.module('fs-extra', () => ({
        default: {
            readdir: mock(async (dirPath) => {
                if (dirPath === testDir) {
                    return filesInDir;
                }
                return [];
            }),
            stat: mock(async (filePath) => ({
                isDirectory: () => false,
                isFile: () => true,
            })),
        }
    }));

    const { CodeIntelligenceService: newCIS } = await import('../../../services/code_intelligence_service.js');
    service = new newCIS();

    // Act
    const foundFiles = await service._walkDirectory(testDir, null);

    // Assert
    expect(foundFiles).toHaveLength(3);
    expect(foundFiles).toContain(path.join(testDir, 'file1.js'));
    expect(foundFiles).toContain(path.join(testDir, 'document.txt'));
    expect(foundFiles).toContain(path.join(testDir, 'image.png'));
  });

  test('should not ignore directories that contain "node_modules" in their name', async () => {
    // Arrange
    const testDir = 'project';
    const directories = ['my_node_modules_project', 'node_modules'];
    const filesInMyProject = ['file1.js'];
    const filesInNodeModules = ['some-lib.js'];

    // Mock fs.readdir and fs.stat
    const readdirMock = mock.module('fs-extra', () => ({
        default: {
            readdir: mock(async (dirPath) => {
                if (dirPath === testDir) return directories;
                if (dirPath === path.join(testDir, 'my_node_modules_project')) return filesInMyProject;
                if (dirPath === path.join(testDir, 'node_modules')) return filesInNodeModules;
                return [];
            }),
            stat: mock(async (filePath) => {
                // Check if the path is one of our mock directories
                if (filePath === path.join(testDir, 'my_node_modules_project') || filePath === path.join(testDir, 'node_modules')) {
                    return { isDirectory: () => true, isFile: () => false };
                }
                // Otherwise, it's a file
                return { isDirectory: () => false, isFile: () => true };
            }),
        }
    }));

    const { CodeIntelligenceService: newCIS } = await import('../../../services/code_intelligence_service.js');
    service = new newCIS();

    // Act
    const foundFiles = await service._walkDirectory(testDir, ['js']);

    // Assert
    expect(foundFiles).toHaveLength(1);
    expect(foundFiles).toContain(path.join(testDir, 'my_node_modules_project', 'file1.js'));
    expect(foundFiles).not.toContain(path.join(testDir, 'node_modules', 'some-lib.js'));
  });
});