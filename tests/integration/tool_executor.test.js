import * as fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';

// No longer need to mock fs-extra, as it's handled globally

// Mock the state manager to prevent Neo4j connection attempts
mock.module("../../engine/state_manager.js", () => ({
  initializeProject: mock(),
  getState: mock(),
}));

mock.module("../../services/model_monitoring.js", () => ({
    trackToolUsage: mock(),
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
  let modelMonitoring;
  let _resetManifestCache;
  const TEST_DIR = global.StigmergyConfig.core_path;

  beforeEach(async () => {
    const toolExecutorModule = await import("../../engine/tool_executor.js");
    const createExecutor = toolExecutorModule.createExecutor;
    _resetManifestCache = toolExecutorModule._resetManifestCache;

    modelMonitoring = await import("../../services/model_monitoring.js");

    _resetManifestCache();

    // Set up the mock engine and executor
    mockEngine = {
        triggerAgent: mock().mockResolvedValue("Task triggered"),
        getAgent: mock().mockReturnValue({ id: 'test-type', systemPrompt: 'Test system prompt', modelTier: 'b_tier' }),
        broadcastEvent: mock()
    };
    execute = createExecutor(mockEngine);
    modelMonitoring.trackToolUsage.mockClear();

    // Create necessary files for the test in the shared temp directory
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

  afterEach(async () => {
    // Clean up the files created in this test suite to not affect others
    const manifestPath = path.join(TEST_DIR, "system_docs");
    const agentsPath = path.join(TEST_DIR, "agents");
    await fs.remove(manifestPath);
    await fs.remove(agentsPath);
  });

  test("should successfully execute a tool that is explicitly permitted", async () => {
    const testContent = "This is a test file.";
    const testPath = "docs/test.txt";
    await fs.ensureDir(path.dirname(testPath));
    await fs.writeFile(testPath, testContent);

    const result = await execute(
      "file_system.readFile",
      { path: testPath },
      "test-agent-permitted"
    );
    const parsedResult = JSON.parse(result);
    expect(parsedResult).toBe(testContent);
    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  test("should throw an error when an agent tries to use a disallowed tool", async () => {
    await expect(
      execute("file_system.readFile", { path: "test.txt" }, "test-agent-denied")
    ).rejects.toThrow("Agent 'test-agent-denied' not permitted for engine tool 'file_system.readFile'.");
    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("should throw an error for invalid arguments based on Zod schema", async () => {
    const dangerousPath = "; rm -rf /"; 

    await expect(
      execute("file_system.readFile", { path: dangerousPath }, "test-agent-permitted")
    ).rejects.toThrow("Invalid arguments for tool 'file_system.readFile'");

    expect(modelMonitoring.trackToolUsage).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  test("should execute stigmergy.task tool", async () => {
    const args = { subagent_type: 'test-type', description: 'test description' };
    const result = await execute("stigmergy.task", args, "test-agent-permitted");
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
      "Agent definition file not found for agent: non-existent-agent"
    );
  });
});
