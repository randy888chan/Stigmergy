import { describe, test, expect, beforeEach, afterAll, mock } from 'bun:test';
import fs from 'fs-extra';
import path from 'path';
import {
  readFile,
  writeFile,
  listFiles,
  appendFile
} from '../../../tools/file_system.js';

afterAll(() => {
    mock.restore();
});

describe('File System Tools', () => {

  beforeEach(() => {
    // Reset the in-memory file system before each test to ensure isolation
    if (fs.vol) {
      fs.vol.reset();
    }
    // Bun's test runner runs in a specific directory, let's ensure our CWD is consistent
    fs.mkdirSync(process.cwd(), { recursive: true });
    // The security model requires files to be in specific subdirectories. Let's create 'src'.
    fs.mkdirSync(path.join(process.cwd(), 'src'), { recursive: true });
  });

  test('should write a file and then read it back', async () => {
    const testPath = 'src/test-file.txt'; // Use a safe, relative path
    const testContent = 'Hello, world!';

    const writeResult = await writeFile({ path: testPath, content: testContent });
    expect(writeResult).toContain('successfully');

    const readResult = await readFile({ path: testPath });
    expect(readResult).toBe(testContent);
  });

  test('should append content to an existing file', async () => {
    const testPath = 'src/append.txt'; // Use a safe, relative path
    const initialContent = 'Initial line.';
    const appendedContent = '\nAppended line.';

    await writeFile({ path: testPath, content: initialContent });
    const appendResult = await appendFile({ path: testPath, content: appendedContent });
    expect(appendResult).toContain('successfully');

    const finalContent = await readFile({ path: testPath });
    expect(finalContent).toBe(initialContent + appendedContent);
  });

  test('should list files and directories in a given path', async () => {
    fs.ensureDirSync('src/dir1');
    fs.writeFileSync('src/file1.txt', 'content');
    fs.writeFileSync('src/dir1/file2.txt', 'content');

    // The tool's parameter is 'directory', not 'path'
    const result = await listFiles({ directory: 'src' });
    
    // The result is now an array of strings from 'glob'
    expect(result).toBeInstanceOf(Array);
    expect(result).toContain('dir1/file2.txt');
    expect(result).toContain('file1.txt');
  });

  test('readFile should return an error if the file does not exist', async () => {
    // The tool is expected to return an error message, not throw.
    const result = await readFile({ path: 'src/non-existent-file.txt' });
    expect(result).toContain('EXECUTION FAILED');
    // Check for the specific error message from the tool's catch block
    expect(result).toContain('ENOENT: no such file or directory');
  });
});