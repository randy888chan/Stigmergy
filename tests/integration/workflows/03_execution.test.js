import { test, describe, expect, mock, beforeEach, afterEach, spyOn } from "bun:test";
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

    mock.module("../../../services/tracing.js", () => ({
      sdk: {
        start: mock(),
        shutdown: mock(async () => {}),
      },
      trace: {
        getTracer: () => ({
          startActiveSpan: (name, fn) =>
            fn({
              setAttribute: () => {},
              recordException: () => {},
              setStatus: () => {},
              end: () => {},
            }),
        }),
      },
      SpanStatusCode: {
        ERROR: "ERROR",
      },
    }));

    // Prevent dotenv from reading actual .env files
    mock.module("dotenv", () => ({ config: mock() }));

    // Set mock env vars BEFORE any application code is imported
    process.env.OPENROUTER_API_KEY = "mock-api-key";
    process.env.OPENROUTER_BASE_URL = "http://localhost:3000";
    process.env.NEO4J_URI = "neo4j://localhost";
    process.env.NEO4J_USER = "neo4j";
    process.env.NEO4J_PASSWORD = "password";

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);

    // DEFINITIVE FIX: Mock the entire 'ai' package to prevent any background processes.
    mock.module("ai", () => ({
      streamText: mockStreamText,
      // Add mocks for any other functions from 'ai' that might be called.
      // For now, streamText is the only one.
    }));

    // Mock services that are instantiated on import
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

    // Dynamically import modules AFTER mocks are in place
    const stateManagerModule = await import(
      "../../../src/infrastructure/state/GraphStateManager.js"
    );
    GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    realCreateExecutor = toolExecutorModule.createExecutor;
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;

    // Setup mock project structure in the pristine filesystem
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentDir, { recursive: true });

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
      const executor = await realCreateExecutor(engineInstance, ai, finalOptions, fs);
      return executor;
    };

    // --- DEFINITIVE FIX: The Singleton Mismatch ---
    // Create the stateManager ONCE and inject it into the engine.
    const mockDriver = {
      session: () => ({
        run: () =>
          Promise.resolve({
            records: [],
            summary: {
              counters: {
                updates: () => ({ nodesCreated: 1, relationshipsCreated: 1 }),
              },
            },
          }),
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };
    stateManager = new GraphStateManager(projectRoot, mockDriver);

    // Get the mock config from the mocked service to inject it
    const { configService } = await import("../../../services/config_service.js");
    const mockConfig = configService.getConfig();

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager, // <-- INJECTION
      config: mockConfig, // <-- INJECTION
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: mockStreamText,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });

    await engine.stateManager.updateStatus({ newStatus: "AWAITING_USER_INPUT" });
  });

  afterEach(async () => {
    // DEFINITIVE FIX: Ensure engine is always stopped to prevent resource leaks.
    if (engine) {
      await engine.stop();
    }
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
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
      .mockResolvedValueOnce(dispatcherReadsPlan) // dispatcher reads plan
      .mockResolvedValueOnce(dispatcherReadsFile) // dispatcher reads file
      .mockResolvedValueOnce(dispatcherDelegates) // dispatcher delegates to executor
      .mockResolvedValueOnce(executorWritesFile) // executor calls writeFile
      .mockResolvedValueOnce({
        text: '{"compliant": true, "reason": "Constitutional."}',
        toolCalls: [],
        finishReason: "stop",
      }) // auditor approves
      .mockResolvedValueOnce(executorFinishes) // executor finishes
      .mockResolvedValueOnce(dispatcherUpdatesStatus) // dispatcher calls updateStatus
      .mockResolvedValueOnce(dispatcherFinishes); // dispatcher finishes

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

    // The file should be written to the executor's sandbox, not the project root.
    const expectedPath = path.join(
      projectRoot,
      ".stigmergy",
      "sandboxes",
      "executor",
      "src/example.js"
    );

    // Log the file system state for debugging
    console.log("Final file system state:", JSON.stringify(vol.toJSON(), null, 2));

    const finalContent = await mockFs.promises.readFile(expectedPath, "utf-8");
    expect(finalContent).toBe('console.log("hello");');
  });
});
