import { appendFile, readFile, writeFile, listFiles } from "../../tools/file_system.js";
import path from "path";

describe("File System Tools Integration", () => {
  let fs;
  const testDir = path.resolve(process.cwd(), "docs", "fs_test");
  const testFilePath = path.join(testDir, "test.txt");
  const nestedDir = path.join(testDir, "nested");
  const nestedFilePath = path.join(nestedDir, "nested.txt");

  beforeAll(async () => {
    fs = (await import("fs-extra")).default;
    await fs.ensureDir(nestedDir);
  });

  beforeEach(async () => {
    if (fs) {
      await fs.emptyDir(testDir);
      await fs.ensureDir(nestedDir);
    }
  });

  afterAll(async () => {
    if (fs) {
      await fs.remove(testDir);
    }
  });

  describe('writeFile and readFile', () => {
    it('should write content to a new file, and then read it', async () => {
      const content = 'Hello, world!';
      const result = await writeFile({ path: testFilePath, content });
      expect(result).toBe(`File ${testFilePath} written successfully`);

      const readContent = await readFile({ path: testFilePath });
      expect(readContent).toBe(content);
    });

    it('should overwrite an existing file', async () => {
        await writeFile({ path: testFilePath, content: 'Initial content' });
        const newContent = 'Overwritten content';
        await writeFile({ path: testFilePath, content: newContent });

        const readContent = await readFile({ path: testFilePath });
        expect(readContent).toBe(newContent);
    });

    it('should throw an error when trying to read a non-existent file', async () => {
        await expect(readFile({ path: testFilePath })).rejects.toThrow();
    });
  });

  describe('appendFile', () => {
    it("should create a file and add content if it doesn't exist", async () => {
        await appendFile({ path: testFilePath, content: "line 1\n" });
        const content = await readFile({ path: testFilePath });
        expect(content).toBe("line 1\n");
    });
  
    it("should append to an existing file", async () => {
        await writeFile({ path: testFilePath, content: "line 1\n" });
        await appendFile({ path: testFilePath, content: "line 2\n" });
        const content = await readFile({ path: testFilePath });
        expect(content).toBe("line 1\nline 2\n");
    });
  });

  describe('listFiles', () => {
    it('should return a list of files in a directory', async () => {
        await writeFile({ path: testFilePath, content: 'test' });
        const files = await listFiles({ directory: testDir });
        // The path should be relative to the directory passed to listFiles
        expect(files).toContain('test.txt');
    });

    it('should return an empty list for an empty directory', async () => {
        const files = await listFiles({ directory: testDir });
        expect(files).toEqual([]);
    });

    it('should work with nested directories', async () => {
        await writeFile({ path: testFilePath, content: 'test' });
        await writeFile({ path: nestedFilePath, content: 'nested test' });
        const files = await listFiles({ directory: testDir });
        expect(files).toHaveLength(2);
        expect(files).toContain('test.txt');
        expect(files).toContain(path.join('nested', 'nested.txt'));
    });
  });
});