import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

// High-fidelity mocks for git operations
const mockCommit = mock(async () => ({ commit: "mock-commit-hash", summary: { changes: 1 } }));
const mockInit = mock(async () => {});
const mockAdd = mock(async () => {});

const mockStreamText = mock();

describe("Genesis Agent Workflow", () => {
  let engine;
  let projectRoot;
  let stateManager;
  let Engine; // To be populated by dynamic import

  beforeEach(async () => {
    vol.reset();
    projectRoot = path.resolve("/test-genesis-project");
    await vol.promises.mkdir(projectRoot, { recursive: true });
    mockInit.mockClear();
    mockCommit.mockClear();
    mockStreamText.mockClear();
    mockAdd.mockClear();

    // DEFINITIVE FIX: Mock all services BEFORE importing any application code
    mock.module("../../../services/tracing.js", () => ({
      sdk: { shutdown: () => Promise.resolve() },
    }));
    mock.module("../../../services/unified_intelligence.js", () => ({
      unifiedIntelligenceService: {},
    }));
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    const mockSimpleGit = () => {
      const git = { init: mockInit, add: mockAdd, commit: mockCommit, cwd: () => git };
      return git;
    };
    mock.module("simple-git", () => ({ default: mockSimpleGit, simpleGit: mockSimpleGit }));
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
      "../../../src/infrastructure/state/GraphStateManager.js"
    );
    const GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    const realCreateExecutor = toolExecutorModule.createExecutor;

    projectRoot = path.resolve("/test-genesis-project");
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    const genesisAgentContent = `
\`\`\`yaml
agent:
  id: "@genesis"
  engine_tools: ["shell.*", "git_tool.*", "file_system.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "genesis.md"), genesisAgentContent);

    const auditorAgentContent = `
\`\`\`yaml
agent:
  id: "@auditor"
  engine_tools: []
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, "auditor.md"), auditorAgentContent);

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
      config: mockConfig,
      startServer: false,
      _test_streamText: mockStreamText,
      _test_fs: mockFs,
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
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;
  });

  test("should initialize a new project, create a file, and make an initial commit", async () => {
    const prompt = "Create a new Node.js project with an index.js file that logs 'hello world'";

    const sandboxDir = path.join(projectRoot, ".stigmergy/sandboxes/genesis");
    await mockFs.ensureDir(sandboxDir);

    const toolCalls = [
      { toolName: "git_tool.init", args: { path: "." }, toolCallId: "1" },
      {
        toolName: "file_system.writeFile",
        args: { path: "index.js", content: "console.log('hello world');" },
        toolCallId: "2",
      },
      { toolName: "git_tool.commit", args: { message: "Initial commit" }, toolCallId: "3" },
    ];

    mockStreamText
      .mockResolvedValueOnce({
        text: "Okay, I will initialize the project.",
        toolCalls: [toolCalls[0]],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        text: "Now, I will create the file.",
        toolCalls: [toolCalls[1]],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        text: '{"compliant": true, "reason": "Constitutional."}',
        toolCalls: [],
        finishReason: "stop",
      })
      .mockResolvedValueOnce({
        text: "Finally, I will commit the file.",
        toolCalls: [toolCalls[2]],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        text: "All tasks are complete.",
        toolCalls: [],
        finishReason: "stop",
      });

    await engine.triggerAgent("@genesis", prompt);

    expect(mockInit).toHaveBeenCalledTimes(1);
    expect(mockAdd).toHaveBeenCalledWith("./*");
    expect(mockCommit).toHaveBeenCalledTimes(1);

    let fileContent;
    try {
      fileContent = await mockFs.promises.readFile(path.join(sandboxDir, "index.js"), "utf-8");
    } catch (e) {
      // Let the test fail if the file doesn't exist
    }
    expect(fileContent).toBe("console.log('hello world');");
  });
});
