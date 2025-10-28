import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js";
import { Engine } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";

const mockStreamText = mock();

describe("Full E-to-E Workflow (Isolated)", () => {
  let engine;
  let projectRoot;
  let writeFileSpy;
  let stateManager; // <-- Added to hold the stateManager instance

  beforeEach(async () => {
    vol.reset(); // PRISTINE STATE
    mockStreamText.mockClear();

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
        }),
      },
    }));

    projectRoot = path.resolve("/test-project");
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    const createAgentFile = async (name) => {
      const content = `
\`\`\`yaml
agent:
  id: "@${name.toLowerCase()}"
  name: ${name}
  core_protocols:
    - role: system
      content: You are the ${name} agent.
  engine_tools: ["file_system.*", "stigmergy.*", "system.*"]
\`\`\`
`;
      await mockFs.promises.writeFile(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    await createAgentFile("Specifier");
    await createAgentFile("QA");
    await createAgentFile("Dispatcher");
    await createAgentFile("Auditor");

    stateManager = new GraphStateManager(projectRoot); // <-- Assign to the outer variable
    const mockUnifiedIntelligenceService = {};
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      return await realCreateExecutor(engineInstance, ai, finalOptions, fs);
    };

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: mockStreamText,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });

    writeFileSpy = spyOn(mockFs.promises, "writeFile");
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("Isolation Test: Manually-triggered workflow should execute correctly", async () => {
    const filePath = "hello.txt";
    const fileContent = "Hello, world!";

    // The mock sequence must now include the final status update.
    const dispatcherToolCalls = [
      {
        toolCallId: "1",
        toolName: "file_system.writeFile",
        args: { path: filePath, content: fileContent },
      },
      {
        toolCallId: "2",
        toolName: "system.updateStatus",
        args: { newStatus: "EXECUTION_COMPLETE" },
      },
    ];
    mockStreamText
      .mockResolvedValueOnce({ text: "Plan created.", finishReason: "stop" }) // Specifier
      .mockResolvedValueOnce({ text: "Plan approved.", finishReason: "stop" }) // QA
      .mockResolvedValueOnce({ toolCalls: dispatcherToolCalls, finishReason: "tool-calls" }) // Dispatcher
      .mockResolvedValueOnce({
        text: '{"compliant": true, "reason": "Constitutional."}',
        toolCalls: [],
        finishReason: "stop",
      }) // Auditor
      .mockResolvedValueOnce({ text: "All tasks are complete.", finishReason: "stop" }); // Final response

    // Correct agent IDs must be used
    await engine.triggerAgent("@specifier", "Create a plan.");
    await engine.triggerAgent("@qa", "Review the plan.");
    await engine.triggerAgent("@dispatcher", "The plan is approved. Please write the file.");

    // The path is now resolved inside the executor, so we check the sandboxed path.
    const expectedPath = path.join(projectRoot, ".stigmergy", "sandboxes", "dispatcher", filePath);

    // More robust check: verify the file content directly.
    const actualContent = await mockFs.promises.readFile(expectedPath, "utf-8");
    expect(actualContent).toBe(fileContent);

    const finalState = await engine.stateManager.getState();
    expect(finalState.project_status).toBe("EXECUTION_COMPLETE");
  });
});
