import { createExecutor, _resetManifestCache } from "../../engine/tool_executor.js";
import { PermissionDeniedError } from "../../engine/tool_executor.js";
import * as fileSystem from "../../tools/file_system.js";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

// Mock the file system tool
jest.mock("../../tools/file_system.js", () => ({
  readFile: jest.fn(),
}));

// Mock the state manager to prevent Neo4j connection attempts
jest.mock("../../engine/state_manager.js", () => ({
  initializeProject: jest.fn(),
  getState: jest.fn(),
}));

// Mock the manifest
const mockManifest = {
  agents: [
    {
      id: "test-agent-permitted",
      tools: ["file_system.readFile"],
    },
    {
      id: "test-agent-denied",
      tools: ["some_other_tool"],
    },
  ],
};

describe("Tool Executor", () => {
  let execute;
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
    execute = createExecutor({}); // engine object is not needed for these tests
    fileSystem.readFile.mockClear();
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
  });

  test("should throw a PermissionDeniedError when an agent tries to use a disallowed tool", async () => {
    await expect(
      execute("file_system.readFile", { path: "test.txt" }, "test-agent-denied")
    ).rejects.toThrow("Agent 'test-agent-denied' not permitted for engine tool 'file_system.readFile'.");
  });

  test("should throw an error for invalid arguments based on Zod schema", async () => {
    const dangerousPath = "; rm -rf /"; // This is not a valid path according to most file systems.

    // We expect the executor to throw an 'input_sanitization_failed' error
    // because the new Zod-based sanitizer will reject the input.
    await expect(
      execute("file_system.readFile", { path: dangerousPath }, "test-agent-permitted")
    ).rejects.toThrow("Invalid arguments for tool 'file_system.readFile'");

    // Ensure the underlying tool was NOT called
    expect(fileSystem.readFile).not.toHaveBeenCalled();
  });
});
