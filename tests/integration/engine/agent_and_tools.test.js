import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js";
import { Engine } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";

const mockSemanticSearch = mock(async (params) => []);
const mockCalculateMetrics = mock(async (params) => ({}));
const mockFindArchitecturalIssues = mock(async (params) => []);

describe("Engine: Agent and Coderag Tool Integration", () => {
  let engine;
  let execute;
  const projectRoot = "/test-project";
  let stateManager;

  beforeEach(async () => {
    vol.reset();
    mockSemanticSearch.mockClear();
    mockCalculateMetrics.mockClear();
    mockFindArchitecturalIssues.mockClear();

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          security: { allowedDirs: ["src", "public"], generatedPaths: ["dist"] },
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
        }),
      },
    }));
    mock.module("../../../services/model_monitoring.js", () => ({
      trackToolUsage: mock(async () => {}),
    }));

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    await mockFs.ensureDir(path.join(process.env.STIGMERGY_CORE_PATH, "agents"));

    const mockDebuggerAgentContent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools: ["coderag.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(
      path.join(process.env.STIGMERGY_CORE_PATH, "agents", "debugger.md"),
      mockDebuggerAgentContent
    );

    stateManager = new GraphStateManager(projectRoot);

    // --- DEFINITIVE FIX: The "Golden Pattern" for Agent & Tool Integration ---

    // 1. Mock the specific service methods this test focuses on.
    const mockUnifiedIntelligenceService = {
      semanticSearch: mockSemanticSearch,
      calculateMetrics: mockCalculateMetrics,
      findArchitecturalIssues: mockFindArchitecturalIssues,
    };

    // 2. Create the factory that injects the mocked service.
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      const executor = await realCreateExecutor(engineInstance, ai, finalOptions, fs);
      return executor;
    };

    engine = new Engine({
      broadcastEvent: mock(),
      projectRoot: projectRoot,
      stateManager,
      startServer: false,
      _test_fs: mockFs,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
    });

    // 3. Await the promise to ensure the executor is initialized.
    await engine.toolExecutorPromise;

    // 4. Get the `execute` function from the engine's fully-formed executor.
    execute = engine.toolExecutor.execute;
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    delete process.env.STIGMERGY_CORE_PATH;
    mock.restore();
  });

  test("should call coderag.semantic_search", async () => {
    const fakeResults = [{ file: "src/app.js", snippet: "function main() {}" }];
    mockSemanticSearch.mockResolvedValue(fakeResults);

    const result = await execute(
      "coderag.semantic_search",
      { query: "main function", project_root: projectRoot },
      "debugger"
    );

    expect(JSON.parse(result)).toEqual(fakeResults);
    expect(mockSemanticSearch).toHaveBeenCalledTimes(1);
    expect(mockSemanticSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: "main function" })
    );
  });

  test("should call coderag.calculate_metrics", async () => {
    const fakeMetrics = { cyclomaticComplexity: 15, maintainability: 85 };
    mockCalculateMetrics.mockResolvedValue(fakeMetrics);

    const result = await execute("coderag.calculate_metrics", {}, "debugger");

    expect(JSON.parse(result)).toEqual(fakeMetrics);
    expect(mockCalculateMetrics).toHaveBeenCalledTimes(1);
  });

  test("should call coderag.find_architectural_issues", async () => {
    const fakeIssues = [{ type: "Cyclic Dependency", files: ["a.js", "b.js"] }];
    mockFindArchitecturalIssues.mockResolvedValue(fakeIssues);

    const result = await execute("coderag.find_architectural_issues", {}, "debugger");

    expect(JSON.parse(result)).toEqual(fakeIssues);
    expect(mockFindArchitecturalIssues).toHaveBeenCalledTimes(1);
  });
});
