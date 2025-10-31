import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

// Static imports removed to prevent module cache pollution.
// They will be dynamically imported in beforeEach.

const mockStreamText = mock();

describe("Phase-Based E2E Test: Planning and Review Handoff", () => {
  let engine;
  let projectRoot;
  let stateManager;
  let Engine, GraphStateManager, realCreateExecutor; // For dynamic imports

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));
    mock.module("llm-cost-calculator", () => ({ getEstimatedCost: () => 0.0 }));
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
        }),
      },
    }));

    // Dynamically import modules AFTER mocks are established
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;
    const gsmModule = await import("../../../src/infrastructure/state/GraphStateManager.js");
    GraphStateManager = gsmModule.GraphStateManager;
    const teModule = await import("../../../engine/tool_executor.js");
    realCreateExecutor = teModule.createExecutor;

    projectRoot = "/app/test-project-planning";
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

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
