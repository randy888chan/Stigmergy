import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { OperationalError, ERROR_TYPES } from "../../utils/errorHandler.js";

// Mock dependent modules
jest.mock("fs-extra");
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
  let toolExecutor;
  let fs;
  let stateManager;
  let fileSystem;
  let research;
  let errorHandler;

  beforeEach(() => {
    jest.resetModules();
    // Re-import modules to get fresh copies with mocks
    toolExecutor = require("../../engine/tool_executor.js");
    fs = require("fs-extra");
    stateManager = require("../../engine/state_manager.js");
    fileSystem = require("../../tools/file_system.js");
    research = require("../../tools/research.js");
    errorHandler = require("../../utils/errorHandler.js");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const getMockManifest = (tools) => `
agents:
  - id: test-agent
    tools: ${JSON.stringify(tools)}`;

  it("should execute a permitted tool", async () => {
    fs.readFile.mockResolvedValue(
      "```yaml\n" + getMockManifest(["file_system.readFile"]) + "\n```"
    );
    fileSystem.readFile.mockResolvedValue("file content");

    const result = await toolExecutor.execute(
      "file_system.readFile",
      { path: "/test.txt" },
      "test-agent"
    );

    expect(fileSystem.readFile).toHaveBeenCalledWith({
      path: "/test.txt",
      agentConfig: expect.any(Object),
    });
    expect(JSON.parse(result)).toBe("file content");
  });

  it("should call withRetry for a retryable tool", async () => {
    fs.readFile.mockResolvedValue("```yaml\n" + getMockManifest(["research.deep_dive"]) + "\n```");
    research.deep_dive.mockResolvedValue("research results");

    await toolExecutor.execute("research.deep_dive", { topic: "AI" }, "test-agent");

    expect(errorHandler.withRetry).toHaveBeenCalled();
    expect(research.deep_dive).toHaveBeenCalled();
  });

  it("should throw an OperationalError for a non-permitted tool", async () => {
    fs.readFile.mockResolvedValue("```yaml\n" + getMockManifest(["research.search"]) + "\n```");

    const execution = toolExecutor.execute("file_system.writeFile", {}, "test-agent");

    await expect(execution).rejects.toThrow();
    await expect(execution).rejects.toHaveProperty("isOperational", true);
    await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.PERMISSION_DENIED);
  });

  it("should throw an OperationalError if the tool does not exist", async () => {
    fs.readFile.mockResolvedValue("```yaml\n" + getMockManifest(["non_existent.*"]) + "\n```");

    const execution = toolExecutor.execute("non_existent.tool", {}, "test-agent");

    await expect(execution).rejects.toThrow();
    await expect(execution).rejects.toHaveProperty("isOperational", true);
    await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.TOOL_EXECUTION);
  });

  it("should throw an OperationalError for Neo4j connection issues", async () => {
    fs.readFile.mockResolvedValue(
      "```yaml\n" + getMockManifest(["code_intelligence.getDefinition"]) + "\n```"
    );
    const neo4jError = new Error("Neo4j connection failed");
    neo4jError.name = "Neo4jError";
    // We need to require the actual module here to mock its implementation
    const codeIntelligence = require("../../tools/code_intelligence.js");
    codeIntelligence.getDefinition.mockRejectedValue(neo4jError);

    const execution = toolExecutor.execute(
      "code_intelligence.getDefinition",
      { symbol: "test" },
      "test-agent"
    );

    await expect(execution).rejects.toThrow();
    await expect(execution).rejects.toHaveProperty("isOperational", true);
    await expect(execution).rejects.toHaveProperty("type", ERROR_TYPES.DB_CONNECTION);
  });
});
