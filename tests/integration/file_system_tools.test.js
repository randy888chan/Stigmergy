import { appendFile, readFile } from "../../tools/file_system.js";
import fs from "fs-extra";
import path from "path";

describe("File System Tools", () => {
  const testFilePath = path.resolve(process.cwd(), "docs", "test_append.txt");
  beforeEach(async () => {
    await fs.remove(testFilePath);
  });
  afterAll(async () => {
    await fs.remove(testFilePath);
  });

  test("appendFile should create a file and add content", async () => {
    await appendFile({ path: testFilePath, content: "line 1" });
    const content = await readFile({ path: testFilePath });
    expect(content).toBe("line 1\n");
  });

  test("appendFile should append to an existing file", async () => {
    await appendFile({ path: testFilePath, content: "line 1" });
    await appendFile({ path: testFilePath, content: "line 2" });
    const content = await readFile({ path: testFilePath });
    expect(content).toBe("line 1\nline 2\n");
  });
});
