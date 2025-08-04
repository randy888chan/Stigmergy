import * as fileSystem from "../../tools/file_system.js";
import path from "path";
import { jest } from "@jest/globals";

describe("File System Security", () => {
  const originalCwd = process.cwd;

  beforeAll(() => {
    // Mock process.cwd for consistent testing
    process.cwd = jest.fn(() => "/project/root");
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  test("Allows access to safe directories", () => {
    expect(fileSystem.resolvePath("src/utils.js")).toBe("/project/root/src/utils.js");

    expect(fileSystem.resolvePath("docs/README.md")).toBe("/project/root/docs/README.md");
  });

  test("Blocks path traversal", () => {
    expect(() => fileSystem.resolvePath("../../etc/passwd")).toThrow("Path traversal attempt");

    expect(() => fileSystem.resolvePath("/absolute/path")).toThrow("Security violation");
  });

  test("Restricts unsafe directories", () => {
    expect(() => fileSystem.resolvePath("node_modules/package")).toThrow(
      "Access restricted to node_modules directory"
    );

    expect(() => fileSystem.resolvePath(".env")).toThrow("Access restricted to .env directory");
  });

  test("Validates input types", () => {
    expect(() => fileSystem.resolvePath(null)).toThrow("Invalid file path");

    expect(() => fileSystem.resolvePath(123)).toThrow("Invalid file path");
  });
});
