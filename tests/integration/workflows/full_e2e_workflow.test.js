import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

const mockStreamText = mock();

describe("Full E-to-E Workflow (Isolated)", () => {
  let engine;
  let projectRoot;
  let writeFileSpy;
  let stateManager;
  let Engine; // To be populated by dynamic import

  beforeEach(async () => {
    vol.reset(); // PRISTINE STATE
    mockStreamText.mockClear();

    projectRoot = path.resolve("/test-project-" + Date.now());
    await vol.promises.mkdir(projectRoot, { recursive: true });

    // DEFINITIVE FIX: Mock all services BEFORE importing any application code
    mock.module("../../../services/tracing.js", () => ({
      sdk: { shutdown: () => Promise.resolve() },
    }));
    mock.module("../../../services/unified_intelligence.js", () => ({
      unifiedIntelligenceService: {},
    }));
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

    // DEFINITIVE FIX: Dynamically import Engine and other dependencies AFTER mocks are established
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;
    const stateManagerModule = await import(
      "../../../engine/infrastructure/state/GraphStateManager.js"
    );
    const GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    const realCreateExecutor = toolExecutorModule.createExecutor;

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    // Create mock rbac.yml required by the engine
    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.ensureDir(governanceDir);
    const rbacContent = `
roles:
  Admin:
    - mission:run
    - governance:propose
    - governance:approve
    - system:updateStatus # Allow the mock tool call
users:
  - username: test-admin
    role: Admin
    key: "test-key"
`;
    await mockFs.promises.writeFile(path.join(governanceDir, 'rbac.yml'), rbacContent);

    const createAgentFile = async (name) => {
      const content = `
\`\`\`yaml
agent:
  id: "@${name.toLowerCase()}"
  name: ${name}
  persona:
    role: "test"
    identity: "test"
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
    const auditorContent = `
\`\`\`yaml
agent:
  id: "@auditor"
  name: Auditor
  persona:
    role: "test"
    identity: "test"
  core_protocols:
    - role: system
      content: You are the Auditor agent.
  engine_tools: ["file_system.writeFile"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, `auditor.md`), auditorContent);

    // --- STATEFUL MOCK DRIVER ---
    let mockProjectDb = {}; // In-memory store for project states
    const mockDriver = {
      session: () => ({
        run: (query, params) => {
          const projectName = params?.projectName || "default";
          if (query.includes("MERGE (p:Project")) {
            const stateProperties = params.properties || {};
            mockProjectDb[projectName] = { ...mockProjectDb[projectName], ...stateProperties };
            return Promise.resolve({
              records: [],
              summary: { counters: { updates: () => ({ nodesCreated: 1 }) } },
            });
          }
          if (query.includes("MATCH (p:Project")) {
            const projectState = mockProjectDb[projectName];
            if (!projectState) return Promise.resolve({ records: [], summary: {} });
            return Promise.resolve({
              records: [{ get: () => ({ properties: projectState }) }],
              summary: {},
            });
          }
          return Promise.resolve({ records: [], summary: { counters: { updates: () => ({}) } } });
        },
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };
    stateManager = new GraphStateManager(projectRoot, mockDriver);
    await stateManager.initialize();
    // --- END STATEFUL MOCK ---

    const mockUnifiedIntelligenceService = {};
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      return await realCreateExecutor(engineInstance, ai, finalOptions, fs);
    };

    const { configService } = await import("../../../services/config_service.js");
    const mockConfig = configService.getConfig();

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      config: mockConfig, // <-- INJECTION
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
    // This is required because the stateManager is external to the engine
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("Isolation Test: Manually-triggered workflow should execute correctly", async () => {
    const filePath = "hello.txt";
    const fileContent = "Hello, world!";

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

    await engine.triggerAgent("@specifier", "Create a plan.");
    await engine.triggerAgent("@qa", "Review the plan.");
    const dispatcherSandbox = path.join(projectRoot, ".stigmergy-core", "sandboxes", "dispatcher");
    await mockFs.ensureDir(dispatcherSandbox);
    await engine.triggerAgent("@dispatcher", "The plan is approved. Please write the file.", { workingDirectory: dispatcherSandbox });

    const expectedPath = path.join(dispatcherSandbox, filePath);

    const actualContent = await mockFs.promises.readFile(expectedPath, "utf-8");
    expect(actualContent).toBe(fileContent);

    const finalState = await engine.stateManager.getState();
    expect(finalState.project_status).toBe("EXECUTION_COMPLETE");
  });
});
