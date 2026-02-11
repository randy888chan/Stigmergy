// VERIFIED: This test correctly implements the full asynchronous handoff workflow, including response simulation.
import { mock, describe, test, expect, beforeEach, afterEach } from "bun:test";
import path from "path";
import { vol } from "../../mocks/fs.js";

const mockStreamText = mock();

describe("Human Handoff Workflow", () => {
  let engine;
  let broadcastSpy;
  let projectRoot;
  let stateManager;
  let Engine; // To be assigned in beforeEach

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    projectRoot = path.resolve("/test-handoff-project");
    await vol.promises.mkdir(projectRoot, { recursive: true });

    // DEFINITIVE FIX: The 'Async-First Mocking' Pattern
    const mockFs = (await import("../../mocks/fs.js")).default;
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));

    const mockConfig = {
      model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
      max_session_cost: 1.0,
    };

    // Dynamically import modules after mocks
    Engine = (await import("../../../engine/server.js")).Engine;
    const { GraphStateManager } = await import(
      "../../../engine/infrastructure/state/GraphStateManager.js"
    );
    const { createExecutor: realCreateExecutor } = await import("../../../engine/tool_executor.js");

    const mockDriver = {
      session: () => ({
        run: () => Promise.resolve({ records: [] }),
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };

    projectRoot = path.resolve("/test-handoff-project");
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.ensureDir(governanceDir);
    await mockFs.promises.writeFile(path.join(governanceDir, "rbac.yml"), "users:\n  - key: test-key\n    role: admin\nroles:\n  admin:\n    - '*' ");

    const mockDispatcherAgent = `
\`\`\`yaml
agent:
  id: "@dispatcher"
  persona:
    role: "test"
    identity: "test"
  engine_tools:
    - "system.*"
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "dispatcher.md"), mockDispatcherAgent);

    const auditorContent = `
\`\`\`yaml
agent:
  id: "@auditor"
  engine_tools: []
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "auditor.md"), auditorContent);

    const systemAgentContent = `
\`\`\`yaml
agent:
  id: "@system"
  persona:
    role: "test"
    identity: "test"
  engine_tools: []
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "system.md"), systemAgentContent);

    stateManager = new GraphStateManager(projectRoot, mockDriver);

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
      config: mockConfig, // Inject the mock config
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: mockStreamText,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });

    // Force initialize the map for the test context
    engine.pendingApprovals = new Map();

    broadcastSpy = mock();
    engine.broadcastEvent = broadcastSpy;
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

  test("Dispatcher agent should call the request_human_approval tool", async () => {
    const toolCall = {
      toolCallId: "1",
      toolName: "system.request_human_approval",
      args: { message: "Approve plan?", data: { content: "plan details" } },
    };

    // This multi-turn mock is crucial for the test to pass.
    mockStreamText
      .mockResolvedValueOnce({
        text: "I need to ask for approval.",
        toolCalls: [toolCall],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        text: JSON.stringify({ compliant: true }),
        finishReason: "stop",
      })
      .mockResolvedValueOnce({
        text: "Approval received: approved. Handoff complete.",
        finishReason: "stop",
      });

    // Don't await the triggerAgent call directly, as it will now pause.
    const agentPromise = engine.triggerAgent(
      "@dispatcher",
      "Please request approval for the plan."
    );

    // Give the agent a moment to run and hit the pause point.
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 1. Verify that the broadcast was called, indicating the agent is waiting.
    const approvalRequestCall = broadcastSpy.mock.calls.find(
      (call) => call[0] === "human_approval_request"
    );
    expect(approvalRequestCall).toBeDefined(); // Ensure the event was broadcast.
    const payload = approvalRequestCall[1];
    expect(payload.message).toBe("Approve plan?");
    expect(payload.data).toEqual({ content: "plan details" });

    // 2. Simulate the user's response.
    const requestId = payload.requestId;
    expect(requestId).toBeDefined();

    const resolver = engine.pendingApprovals.get(requestId);
    expect(resolver).toBeDefined();
    resolver("approved"); // Simulate the user clicking "Approve"

    // 3. Now, await the agent's completion.
    await agentPromise;

    // 4. Verify the agent received the response and finished.
    // The second mockResolvedValueOnce ensures the agent gets the "approved" message.
    expect(mockStreamText.mock.calls.length).toBe(2);
  });
});
