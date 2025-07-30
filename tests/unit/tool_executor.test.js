import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";

// Mock dependent modules at the top level. Jest hoists these mocks.
jest.mock("fs-extra");
jest.mock("../../engine/state_manager.js");
jest.mock("../../tools/file_system.js");
jest.mock("../../tools/shell.js");
jest.mock("../../tools/research.js");
jest.mock("../../tools/gemini_cli_tool.js");
jest.mock("../../tools/code_intelligence.js");

describe("Tool Executor", () => {
  let toolExecutor;
  let fs;
  let stateManager;
  let fileSystem;

  beforeEach(() => {
    // Reset modules before each test to clear caches (like the manifest cache)
    jest.resetModules();

    // Re-import the modules to get fresh copies with mocks applied.
    // We use require here for simplicity within the synchronous beforeEach.
    // Babel-jest will handle the interoperability.
    toolExecutor = require("../../engine/tool_executor.js");
    fs = require("fs-extra");
    stateManager = require("../../engine/state_manager.js");
    fileSystem = require("../../tools/file_system.js");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should execute a permitted tool for an agent", async () => {
    const mockManifest = `
agents:
  - id: test-agent
    tools:
      - file_system.readFile`;
    fs.readFile.mockResolvedValue("```yaml\n" + mockManifest + "\n```");
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

  it("should execute a wildcard permitted tool for an agent", async () => {
    const mockManifest = `
agents:
  - id: test-agent
    tools:
      - system.*`;
    fs.readFile.mockResolvedValue("```yaml\n" + mockManifest + "\n```");

    await toolExecutor.execute("system.updateStatus", { status: "testing" }, "test-agent");

    expect(stateManager.updateStatus).toHaveBeenCalledWith({
      newStatus: "testing",
      message: undefined,
      artifact_created: undefined,
    });
  });

  it("should throw a PermissionDeniedError for a non-permitted tool", async () => {
    const mockManifest = `
agents:
  - id: restricted-agent
    tools:
      - research.search`;
    fs.readFile.mockResolvedValue("```yaml\n" + mockManifest + "\n```");

    await expect(
      toolExecutor.execute(
        "file_system.writeFile",
        { path: "/test.txt", content: "data" },
        "restricted-agent"
      )
    ).rejects.toThrow("Agent 'restricted-agent' not permitted for tool 'file_system.writeFile'.");
  });

  it("should throw an error if the tool does not exist", async () => {
    const mockManifest = `
agents:
  - id: test-agent
    tools:
      - non_existent_tool.*`; // Grant permission first
    fs.readFile.mockResolvedValue("```yaml\n" + mockManifest + "\n```");

    await expect(
      toolExecutor.execute("non_existent_tool.doSomething", {}, "test-agent")
    ).rejects.toThrow("Tool 'non_existent_tool.doSomething' not found.");
  });

  it("should throw an error if the agent does not exist in the manifest", async () => {
    const mockManifest = `
agents:
  - id: some-other-agent
    tools:
      - file_system.readFile`;
    fs.readFile.mockResolvedValue("```yaml\n" + mockManifest + "\n```");

    await expect(toolExecutor.execute("file_system.readFile", {}, "unknown-agent")).rejects.toThrow(
      "Agent 'unknown-agent' not found."
    );
  });
});
