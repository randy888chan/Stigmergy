import { describe, test, expect, beforeEach } from 'bun:test';
import { Volume } from 'memfs';
import path from 'path';
import {
  readFile,
  writeFile,
  listFiles,
  appendFile,
} from '../../../tools/file_system.js';

// 1. Create an in-memory file system using memfs.
const vol = new Volume();
// The 'fs' from memfs has callback-based async methods by default.
const memfs = require('memfs').createFsFromVolume(vol);

// 2. Create a mock that correctly mimics the fs-extra promise-based API.
const mockFs = {
  // Manually map the promise-based methods that the tools use.
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  appendFile: memfs.promises.appendFile,
  // fs-extra's ensureDir is async, so we map it to mkdir (recursive).
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),

  // Include the sync methods needed for setup and path resolution.
  statSync: memfs.statSync,
  mkdirSync: memfs.mkdirSync,
  writeFileSync: memfs.writeFileSync,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
};

describe('File System Tools (with Corrected In-Memory FS)', () => {
  const projectRoot = process.cwd();

  beforeEach(() => {
    // Before each test, reset the volume to ensure a clean slate.
    vol.reset();
    // Set up the base 'src' directory in our in-memory file system.
    mockFs.mkdirSync(path.join(projectRoot, 'src'), { recursive: true });
  });

  test('should write a file and then read it back', async () => {
    const testPath = 'src/test-file.txt';
    const testContent = 'Hello, world!';

    // Inject the correctly mocked 'fs' object.
    const writeResult = await writeFile({ path: testPath, content: testContent, fs: mockFs, projectRoot });
    expect(writeResult).toContain('successfully');

    const readResult = await readFile({ path: testPath, fs: mockFs, projectRoot });
    expect(readResult).toBe(testContent);
  });

  test('should append content to an existing file', async () => {
    const testPath = 'src/append.txt';
    const initialContent = 'Initial line.';
    const appendedContent = '\nAppended line.';

    await writeFile({ path: testPath, content: initialContent, fs: mockFs, projectRoot });
    const appendResult = await appendFile({ path: testPath, content: appendedContent, fs: mockFs, projectRoot });
    expect(appendResult).toContain('successfully');

    const finalContent = await readFile({ path: testPath, fs: mockFs, projectRoot });
    expect(finalContent).toBe(initialContent + appendedContent);
  });

  test('should list files and directories in a given path', async () => {
    mockFs.ensureDirSync(path.join(projectRoot, 'src/dir1'));
    mockFs.writeFileSync(path.join(projectRoot, 'src/file1.txt'), 'content');
    mockFs.writeFileSync(path.join(projectRoot, 'src/dir1/file2.txt'), 'content');

    // Test the listFiles function, injecting our mock fs.
    const result = await listFiles({ directory: 'src', fs: mockFs, projectRoot });

    // Verify the results. Glob returns platform-specific paths, so we normalize.
    const normalizedResult = result.map(p => p.replace(/\\/g, '/'));
    expect(normalizedResult).toBeInstanceOf(Array);
    expect(normalizedResult).toContain('file1.txt');
    expect(normalizedResult).toContain('dir1/file2.txt');
  });

  test('readFile should return an error if the file does not exist', async () => {
    const result = await readFile({ path: 'src/non-existent-file.txt', fs: mockFs, projectRoot });
    expect(result).toContain('EXECUTION FAILED');
    // memfs provides Node.js-like error codes.
    expect(result).toContain('ENOENT');
  });
});