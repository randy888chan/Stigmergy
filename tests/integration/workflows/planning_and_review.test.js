import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";
import { Engine } from "../../../engine/server.js";

const mockStreamText = mock();

describe("Phase-Based E2E Test: Planning and Review Handoff", () => {
  let engine;
  let projectRoot;
  let stateManager;

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    projectRoot = "/app/test-project-planning";
    await vol.promises.mkdir(projectRoot, { recursive: true });

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

    // Corrected Pathing: .stigmergy-core MUST be inside the project root for the engine to find it.
    projectRoot = "/app/test-project-planning";
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.ensureDir(governanceDir);
    await mockFs.promises.writeFile(path.join(governanceDir, "rbac.yml"), "users:\n  - key: test-key\n    role: admin\nroles:\n  admin:\n    - '*' ");

    const createAgentFile = async (name, tools) => {
      const content = `
\`\`\`yaml
agent:
  id: "@${name.toLowerCase()}"
  name: ${name}
  engine_tools: [${tools.join(", ")}]
\`\`\`
`;
      await mockFs.promises.writeFile(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    await createAgentFile("specifier", ['"stigmergy.task"']);
    await createAgentFile("qa", []);

    // --- DEFINITIVE FIX: The "Golden Pattern" for Mock-Aware Sub-agent Testing ---

    // 1. Create a single, mock instance of the service that was causing issues.
    const mockUnifiedIntelligenceService = {
      initialize: mock(async () => {}),
      calculateMetrics: mock(async () => ({})),
      // Add any other methods that might be called
    };

    // 2. Define the factory that will be injected into the main engine.
    //    This factory creates the tool executor and ensures any sub-engines
    //    created by `stigmergy.task` inherit the mocks.
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      // We pass the *mock* service into the real executor creator.
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      const executor = await realCreateExecutor(engineInstance, ai, finalOptions, fs);

      // We DON'T mock the `stigmergy.task` tool here anymore. The fix in the
      // application code (`tool_executor.js`) handles mock propagation automatically.
      return executor;
    };

    // --- STATEFUL MOCK DRIVER ---
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
    // --- END STATEFUL MOCK ---

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
      // 3. Inject the mock service AND the factory into the main Engine.
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });
  });

  afterEach(async () => {
    if (engine) await engine.stop();
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("Specifier should correctly delegate a plan to the QA agent", async () => {
    const goal = "Create a plan for a simple file.";
    const specifierToolCall = {
      toolCalls: [
        {
          toolCallId: "1",
          toolName: "stigmergy.task",
          args: { subagent_type: "@qa", description: "Please review the generated plan." },
        },
      ],
      finishReason: "tool-calls",
    };
    const specifierFinalResponse = {
      text: "Delegating to QA.",
      toolCalls: [],
      finishReason: "stop",
    };
    const qaFinalResponse = { text: "Plan looks good.", finishReason: "stop" };

    mockStreamText
      .mockResolvedValueOnce(specifierToolCall)
      .mockResolvedValueOnce(qaFinalResponse)
      .mockResolvedValueOnce(specifierFinalResponse);

    await engine.triggerAgent("@specifier", goal);
    expect(mockStreamText).toHaveBeenCalledTimes(3);
  });
});
