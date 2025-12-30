import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

const mockStreamText = mock();

describe("Execution Workflow: @dispatcher and @executor", () => {
  let engine;
  const projectRoot = "/test-project-exec";
  let GraphStateManager, Engine, realCreateExecutor, stateManager;

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    // Create the root directory for the in-memory file system
    await mockFs.promises.mkdir(projectRoot, { recursive: true });

    // DEFINITIVE FIX: Mock all services BEFORE importing any application code
    mock.module("../../../services/tracing.js", () => ({
      sdk: { shutdown: () => Promise.resolve() },
    }));
    mock.module("../../../services/unified_intelligence.js", () => ({
      unifiedIntelligenceService: {},
    }));
    mock.module("dotenv", () => ({ config: mock() }));
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: {
            reasoning_tier: { provider: "mock", model_name: "mock-model" },
            execution_tier: { provider: "mock", model_name: "mock-model" },
          },
        }),
      },
    }));
    mock.module("../../../services/model_monitoring.js", () => ({
      trackToolUsage: mock(async () => {}),
      appendLog: mock(async () => {}),
    }));

    // DEFINITIVE FIX: Dynamically import Engine and other dependencies AFTER mocks are established
    const stateManagerModule = await import(
      "../../../src/infrastructure/state/GraphStateManager.js"
    );
    GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    realCreateExecutor = toolExecutorModule.createExecutor;
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentDir, { recursive: true });

    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.promises.mkdir(governanceDir, { recursive: true });
    await mockFs.promises.writeFile(path.join(governanceDir, "rbac.yml"), "users:\n  - key: test-key\n    role: admin\nroles:\n  admin:\n    - '*' ");

    const dispatcherContent = `
\`\`\`yaml
agent:
  id: "@dispatcher"
  engine_tools: ["file_system.*", "stigmergy.task", "system.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "dispatcher.md"), dispatcherContent);
    const executorContent = `
\`\`\`yaml
agent:
  id: "@executor"
  engine_tools: ["file_system.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "executor.md"), executorContent);
    const auditorContent = `
\`\`\`yaml
agent:
  id: "@auditor"
  engine_tools: []
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "auditor.md"), auditorContent);

    const mockUnifiedIntelligenceService = {
      initialize: mock(async () => {}),
      calculateMetrics: mock(async () => ({})),
    };

    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      return await realCreateExecutor(engineInstance, ai, finalOptions, fs);
    };

    let mockProjectDb = {};
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
            const record = { get: (key) => ({ properties: projectState }) };
            return Promise.resolve({ records: [record], summary: {} });
          }
          return Promise.resolve({ records: [], summary: { counters: { updates: () => ({}) } } });
        },
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };
    stateManager = new GraphStateManager(projectRoot, mockDriver);
    await stateManager.initialize();

    const { configService } = await import("../../../services/config_service.js");
    const mockConfig = configService.getConfig();

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      config: mockConfig,
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: mockStreamText,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });

    await engine.stateManager.updateStatus({ newStatus: "AWAITING_USER_INPUT" });
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
    delete process.env.OPENROUTER_API_KEY;
    delete process.env.OPENROUTER_BASE_URL;
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;
  });

  test("Dispatcher should read plan and delegate to executor", async () => {
    const dispatcherReadsPlan = {
      text: "Reading plan...",
      toolCalls: [{ toolName: "file_system.readFile", args: { path: "plan.md" }, toolCallId: "1" }],
      finishReason: "tool-calls",
    };
    const dispatcherReadsFile = {
      text: "Reading file...",
      toolCalls: [
        { toolName: "file_system.readFile", args: { path: "src/example.js" }, toolCallId: "2" },
      ],
      finishReason: "tool-calls",
    };
    const dispatcherDelegates = {
      text: "Delegating...",
      toolCalls: [
        {
          toolName: "stigmergy.task",
          args: {
            subagent_type: "@executor",
            description: 'Create file src/example.js with content: console.log("hello");',
          },
          toolCallId: "3",
        },
      ],
      finishReason: "tool-calls",
    };
    const executorWritesFile = {
      text: "Writing file...",
      toolCalls: [
        {
          toolName: "file_system.writeFile",
          args: { path: "src/example.js", content: 'console.log("hello");' },
          toolCallId: "4",
        },
      ],
      finishReason: "tool-calls",
    };
    const executorFinishes = { text: "File written.", toolCalls: [], finishReason: "stop" };
    const dispatcherUpdatesStatus = {
      text: "Updating status.",
      toolCalls: [
        { toolName: "system.updateStatus", args: { newStatus: "PLAN_EXECUTED" }, toolCallId: "5" },
      ],
      finishReason: "tool-calls",
    };
    const dispatcherFinishes = { text: "All done.", toolCalls: [], finishReason: "stop" };

    mockStreamText
      .mockResolvedValueOnce(dispatcherReadsPlan)
      .mockResolvedValueOnce(dispatcherReadsFile)
      .mockResolvedValueOnce(dispatcherDelegates)
      .mockResolvedValueOnce(executorWritesFile)
      .mockResolvedValueOnce({
        text: '{"compliant": true, "reason": "Constitutional."}',
        toolCalls: [],
        finishReason: "stop",
      })
      .mockResolvedValueOnce(executorFinishes)
      .mockResolvedValueOnce(dispatcherUpdatesStatus)
      .mockResolvedValueOnce(dispatcherFinishes);

    const planContent = `
tasks:
  - id: "1"
    agent: "@executor"
    description: "Create file src/example.js with content: console.log(\\"hello\\");"
    files_to_create_or_modify: ["src/example.js"]
`;
    await mockFs.promises.writeFile(path.join(projectRoot, "plan.md"), planContent);
    await mockFs.promises.mkdir(path.join(projectRoot, "src"), { recursive: true });
    await mockFs.promises.writeFile(path.join(projectRoot, "src/example.js"), "// initial content");

    await engine.triggerAgent("@dispatcher", "Proceed with the plan.");

    const finalState = await engine.stateManager.getState();
    expect(finalState.project_status).toBe("PLAN_EXECUTED");

    const expectedPath = path.join(
      projectRoot,
      ".stigmergy",
      "sandboxes",
      "executor",
      "src/example.js"
    );

    const finalContent = await mockFs.promises.readFile(expectedPath, "utf-8");
    expect(finalContent).toBe('console.log("hello");');
  });
});
