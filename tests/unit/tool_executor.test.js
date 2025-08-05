import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import fs from "fs-extra";
import { OperationalError, ERROR_TYPES } from "../../utils/errorHandler.js";
import { createExecutor, _resetManifestCache } from "../../engine/tool_executor.js";
import * as stateManager from "../../engine/state_manager.js";
import * as fileSystem from "../../tools/file_system.js";
import * as research from "../../tools/research.js";
import * as codeIntelligence from "../../tools/code_intelligence.js";
import * as errorHandler from "../../utils/errorHandler.js";

// Mock dependent modules
jest.mock("../../engine/state_manager.js");
jest.mock("../../tools/file_system.js");
jest.mock("../../tools/shell.js");
jest.mock("../../tools/research.js");
jest.mock("../../tools/gemini_cli_tool.js");
jest.mock("../../tools/code_intelligence.js");
jest.mock("../../utils/errorHandler.js", () => ({
  ...jest.requireActual("../../utils/errorHandler.js"),
  withRetry: jest.fn((fn) => fn), // Mock withRetry to just call the function
}));

describe("Tool Executor", () => {
  let execute;
  let mockEngine;

  beforeEach(() => {
    _resetManifestCache(); // Reset the manifest cache before each test
    mockEngine = {
      start: jest.fn(),
      stop: jest.fn(),
    };
    execute = createExecutor(mockEngine);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getMockManifest = (tools) =>
    `agents:\n  - id: test-agent\n    tools: ${JSON.stringify(tools)}`;

  it("should execute a permitted tool", async () => {
    const readFileSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("```yaml\n" + getMockManifest(["file_system.readFile"]) + "\n```");
    fileSystem.readFile.mockResolvedValue("file content");

    const result = await execute("file_system.readFile", { path: "/test.txt" }, "test-agent");

    expect(fileSystem.readFile).toHaveBeenCalledWith({
      path: "/test.txt",
      agentConfig: expect.any(Object),
    });
    expect(JSON.parse(result)).toBe("file content");
    readFileSpy.mockRestore();
  });

  it("should call withRetry for a retryable tool", async () => {
    const readFileSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("```yaml\n" + getMockManifest(["research.deep_dive"]) + "\n```");
    research.deep_dive.mockResolvedValue("research results");

    await execute("research.deep_dive", { topic: "AI" }, "test-agent");

    expect(errorHandler.withRetry).toHaveBeenCalled();
    expect(research.deep_dive).toHaveBeenCalled();
    readFileSpy.mockRestore();
  });

  it("should throw an OperationalError for a non-permitted tool", async () => {
    const readFileSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("```yaml\n" + getMockManifest(["research.search"]) + "\n```");

    const execution = execute("file_system.writeFile", {}, "test-agent");

    await expect(execution).rejects.toThrow(OperationalError);
    await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.PERMISSION_DENIED);
    readFileSpy.mockRestore();
  });

  it("should throw an Error if the tool does not exist", async () => {
    const readFileSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue("```yaml\n" + getMockManifest(["non_existent.*"]) + "\n```");

    const execution = execute("non_existent.tool", {}, "test-agent");

    await expect(execution).rejects.toThrow("Tool 'non_existent.tool' not found.");
    readFileSpy.mockRestore();
  });

  it("should throw an OperationalError for Neo4j connection issues", async () => {
    const readFileSpy = jest
      .spyOn(fs, "readFile")
      .mockResolvedValue(
        "```yaml\n" + getMockManifest(["code_intelligence.getDefinition"]) + "\n```"
      );
    const neo4jError = new Error("Neo4j connection failed");
    neo4jError.name = "Neo4jError";
    codeIntelligence.getDefinition.mockRejectedValue(neo4jError);

    const execution = execute("code_intelligence.getDefinition", { symbol: "test" }, "test-agent");

    await expect(execution).rejects.toThrow(OperationalError);
    await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.DB_CONNECTION);
    readFileSpy.mockRestore();
  });

  describe("System Tool", () => {
    let readFileSpy;
    beforeEach(() => {
      readFileSpy = jest
        .spyOn(fs, "readFile")
        .mockResolvedValue("```yaml\n" + getMockManifest(["system.executeCommand"]) + "\n```");
    });
    afterEach(() => {
      readFileSpy.mockRestore();
    });

    it("should be blocked by the sanitizer", async () => {
      // To test the sanitizer, we need to bypass the permission check,
      // so we grant permission to the otherwise blocked tool.
      readFileSpy.mockResolvedValue("```yaml\n" + getMockManifest(["shell.execute"]) + "\n```");
      const execution = execute("shell.execute", { command: "any" }, "test-agent");
      await expect(execution).rejects.toThrow(OperationalError);
      await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.SECURITY);
      await expect(execution).rejects.toHaveProperty("message_key", "input_sanitization_failed");
    });
  });
});
