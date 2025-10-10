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
// 2. Create the fs mock from the volume. This object has the callback-based methods
//    that libraries like `glob` expect.
const memfs = require('memfs').createFsFromVolume(vol);

// 3. Create a comprehensive mock that combines promise-based methods for our tools
//    and the underlying callback-based methods for `glob`.
const mockFs = {
  ...memfs, // Spread the original memfs object for all callback-based methods
  promises: memfs.promises, // Expose the promises API

  // Explicitly map the promise-based methods our tools use.
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  appendFile: memfs.promises.appendFile,
  readdir: memfs.promises.readdir,

  // fs-extra's ensureDir is async, so we map it to mkdir (recursive).
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),

  // Include the sync methods needed for setup and path resolution.
  statSync: memfs.statSync,
  mkdirSync: memfs.mkdirSync,
  writeFileSync: memfs.writeFileSync,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
};


describe('File System Tools (Definitive Fix)', () => {
  // Use a consistent, absolute base path for the mock file system.
  const projectRoot = '/app';
  const srcPath = path.join(projectRoot, 'src');

  beforeEach(() => {
    // Before each test, reset the volume to ensure a clean slate.
    vol.reset();
    // Set up the base 'src' directory in our in-memory file system.
    mockFs.ensureDirSync(srcPath, { recursive: true });
  });

  test('should write a file and then read it back', async () => {
    const testPath = path.join(srcPath, 'test-file.txt');
    const testContent = 'Hello, world!';

    // Pass the mock filesystem as the second argument.
    const writeResult = await writeFile({ path: testPath, content: testContent }, mockFs);
    expect(writeResult).toContain('successfully');

    const readResult = await readFile({ path: testPath }, mockFs);
    expect(readResult).toBe(testContent);
  });

  test('should append content to an existing file', async () => {
    const testPath = path.join(srcPath, 'append.txt');
    const initialContent = 'Initial line.';
    const appendedContent = '\nAppended line.';

    await writeFile({ path: testPath, content: initialContent }, mockFs);
    const appendResult = await appendFile({ path: testPath, content: appendedContent }, mockFs);
    expect(appendResult).toContain('successfully');

    const finalContent = await readFile({ path: testPath }, mockFs);
    expect(finalContent).toBe(initialContent + appendedContent);
  });

  test('listFiles should list files recursively and return relative paths', async () => {
    // Setup with absolute paths
    const dir1Path = path.join(srcPath, 'dir1');
    mockFs.ensureDirSync(dir1Path);
    mockFs.writeFileSync(path.join(srcPath, 'file1.txt'), 'content');
    mockFs.writeFileSync(path.join(dir1Path, 'file2.txt'), 'content');

    // Test the listFiles function, passing the comprehensive mock fs.
    // The `glob` library inside `listFiles` will now use the callback-based methods
    // from the mock, ensuring it operates on the in-memory filesystem.
    const result = await listFiles({ directory: srcPath }, mockFs);

    // The tool uses glob which returns relative paths from the CWD.
    const normalizedResult = result.map(p => p.replace(/\\/g, '/'));
    const expected = ['file1.txt', 'dir1/file2.txt'];

    expect(normalizedResult).toBeInstanceOf(Array);
    expect(normalizedResult).toHaveLength(2);
    // Use arrayContaining because glob doesn't guarantee order.
    expect(normalizedResult).toEqual(expect.arrayContaining(expected));
  });

  test('readFile should return an error if the file does not exist', async () => {
    const nonExistentPath = path.join(srcPath, 'non-existent-file.txt');
    const result = await readFile({ path: nonExistentPath }, mockFs);
    expect(result).toContain('EXECUTION FAILED');
    expect(result).toContain('ENOENT');
  });
});