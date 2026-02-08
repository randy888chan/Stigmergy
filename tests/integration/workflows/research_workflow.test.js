import { mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../engine/infrastructure/state/GraphStateManager.js";
import { Engine } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";

const executeMock = mock();
const mockStreamText = mock();
let engine, stateManager;

describe("Research Workflow", () => {
  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    const projectRoot = path.join(process.cwd(), "test-project-research");
    await vol.promises.mkdir(projectRoot, { recursive: true });
    executeMock.mockClear();

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: { reasoning_tier: { provider: "mock_provider", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
        }),
      },
    }));

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.ensureDir(agentDir);

    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.ensureDir(governanceDir);
    await mockFs.promises.writeFile(path.join(governanceDir, "rbac.yml"), "users:\n  - key: test-key\n    role: admin\nroles:\n  admin:\n    - '*' ");

    const analystAgentContent = `
    \`\`\`yaml
    agent:
      id: "analyst"
      engine_tools: ["research.*"]
    \`\`\`
    `;
    await mockFs.promises.writeFile(path.join(agentDir, "analyst.md"), analystAgentContent);

    const mockUnifiedIntelligenceService = {};
    const testExecutorFactory = async (engine, ai, options) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      const executor = await realCreateExecutor(engine, ai, finalOptions, mockFs);
      executor.execute = executeMock;
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
    if (engine) {
      await engine.stop();
    }
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("triggers deep_dive, evaluate_sources, and reports with confidence", async () => {
    const researchTopic = "What is the impact of AI on software development?";

    mockStreamText
      .mockResolvedValueOnce({
        toolCalls: [
          {
            toolCallId: "1",
            toolName: "research.deep_dive",
            args: { query: "impact of AI on SWE" },
          },
        ],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        toolCalls: [
          {
            toolCallId: "2",
            toolName: "research.deep_dive",
            args: { query: "AI in software testing" },
          },
        ],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        toolCalls: [
          {
            toolCallId: "3",
            toolName: "research.evaluate_sources",
            args: { urls: ["http://a.com", "http://b.com"] },
          },
        ],
        finishReason: "tool-calls",
      })
      .mockResolvedValueOnce({
        text: "Final Report...\n\n**Confidence Score:** High...",
        finishReason: "stop",
      });

    executeMock.mockImplementation(async (toolName, args) => {
      if (toolName === "research.deep_dive") {
        return JSON.stringify({
          new_learnings: `Learnings from ${args.query}`,
          sources: ["http://a.com", "http://b.com"],
        });
      }
      if (toolName === "research.evaluate_sources") {
        return JSON.stringify([
          { url: "http://a.com", credibility_score: 9, justification: "Good." },
        ]);
      }
      return JSON.stringify({});
    });

    await engine.triggerAgent("@analyst", researchTopic);

    const deepDiveCalls = executeMock.mock.calls.filter((call) => call[0] === "research.deep_dive");
    expect(deepDiveCalls.length).toBe(2);

    const evaluateSourcesCalls = executeMock.mock.calls.filter(
      (call) => call[0] === "research.evaluate_sources"
    );
    expect(evaluateSourcesCalls.length).toBe(1);

    expect(mockStreamText).toHaveBeenCalledTimes(4);
  });
});
