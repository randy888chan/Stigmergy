import { createExecutor, _resetManifestCache } from "../../engine/tool_executor.js";
import * as fileSystem from "../../tools/file_system.js";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import * as modelMonitoring from "../../services/model_monitoring.js";

// Mock the file system tool
jest.mock("../../tools/file_system.js", () => ({
  readFile: jest.fn(),
}));

// Mock the state manager to prevent Neo4j connection attempts
jest.mock("../../engine/state_manager.js", () => ({
  initializeProject: jest.fn(),
  getState: jest.fn(),
}));

jest.mock("../../services/model_monitoring.js", () => ({
    trackToolUsage: jest.fn(),
}));

// Mock the manifest
const mockManifest = {
  agents: [
    {
      id: "test-agent-permitted",
      tools: ["file_system.readFile", "stigmergy.task"],
    },
    {
      id: "test-agent-denied",
      tools: ["some_other_tool"],
    },
  ],
};

describe("Tool Executor", () => {
  let execute;
  let mockEngine;
  const TEST_DIR = path.join(__dirname, "tool_executor_test_temp_core");

  beforeAll(async () => {
    // Create a completely isolated directory for this test suite
    await fs.ensureDir(TEST_DIR);
    global.StigmergyConfig = { core_path: TEST_DIR };

    const manifestPath = path.join(TEST_DIR, "system_docs", "02_Agent_Manifest.md");
    await fs.ensureDir(path.dirname(manifestPath));
    const yamlString = yaml.dump(mockManifest);
    await fs.writeFile(manifestPath, "```yaml\n" + yamlString + "\n```");

    const agentsPath = path.join(TEST_DIR, "agents");
    await fs.ensureDir(agentsPath);

    const permittedAgentContent = `
agent:
  id: test-agent-permitted
  engine_tools:
    - "file_system.readFile"
    - "stigmergy.task"
`;
    await fs.writeFile(
      path.join(agentsPath, "test-agent-permitted.md"),
      "```yaml\n" + permittedAgentContent + "\n```"
    );

    const deniedAgentContent = `
agent:
  id: test-agent-denied
  engine_tools:
    - "some_other_tool"
`;
    await fs.writeFile(
      path.join(agentsPath, "test-agent-denied.md"),
      "```yaml\n" + deniedAgentContent + "\n```"
    );
  });

  afterAll(async () => {
    await fs.remove(TEST_DIR);
    delete global.StigmergyConfig;
  });

  beforeEach(() => {
    _resetManifestCache();
    mockEngine = {
        triggerAgent: jest.fn().mockResolvedValue("Task triggered"),
        getAgent: jest.fn().mockReturnValue({ id: 'test-type', systemPrompt: 'Test system prompt', modelTier: 'b_tier' })
    };
    execute = createExecutor(mockEngine);
    fileSystem.readFile.mockClear();
    modelMonitoring.trackToolUsage.mockClear();
  });

  test("should successfully execute a tool that is explicitly permitted", async () => {
    fileSystem.readFile.mockResolvedValue("file content");
    const result = await execute(
      "file_system.readFile",
      { path: "test.txt" },
      "test-agent-permitted"
    );
    expect(fileSystem.readFile).toHaveBeenCalledWith({
      path: "test.txt",
      agentConfig: expect.any(Object),
    });
    expect(result).toBe(JSON.stringify("file content", null, 2));
    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("should throw an error when an agent tries to use a disallowed tool", async () => {
    await expect(
      execute("file_system.readFile", { path: "test.txt" }, "test-agent-denied")
    ).rejects.toThrow("Agent 'test-agent-denied' not permitted for engine tool 'file_system.readFile'.");
    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("should throw an error for invalid arguments based on Zod schema", async () => {
    const dangerousPath = "; rm -rf /"; // This is not a valid path according to most file systems.

    await expect(
      execute("file_system.readFile", { path: dangerousPath }, "test-agent-permitted")
    ).rejects.toThrow("Invalid arguments for tool 'file_system.readFile'");

    expect(fileSystem.readFile).not.toHaveBeenCalled();
    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("should execute stigmergy.task tool", async () => {
    const args = { subagent_type: 'test-type', description: 'test description' };
    const result = await execute("stigmergy.task", args, "test-agent-permitted");
    // The stigmergy.task tool calls engine.getAgent and engine.triggerAgent
    // We need to check that getAgent was called with the subagent_type
    // and that triggerAgent was called with the agent object and description
    expect(mockEngine.getAgent).toHaveBeenCalledWith('test-type');
    expect(result).toBe(JSON.stringify("Task triggered", null, 2));
  });

  test("should throw an error for a non-existent tool", async () => {
    await expect(execute("non_existent.tool", {}, "test-agent-permitted")).rejects.toThrow(
      "Tool 'non_existent.tool' not found or is not a function in the engine toolbelt."
    );
  });

  test("should throw an error if agent definition file is not found", async () => {
    await expect(execute("file_system.readFile", {}, "non-existent-agent")).rejects.toThrow(
      "ENOENT: no such file or directory"
    );
  });
});
