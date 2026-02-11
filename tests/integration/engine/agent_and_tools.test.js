import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../engine/infrastructure/state/GraphStateManager.js";
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
    await mockFs.promises.mkdir(projectRoot, { recursive: true });
    mockSemanticSearch.mockClear();
    mockCalculateMetrics.mockClear();
    mockFindArchitecturalIssues.mockClear();

    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("../../../services/model_monitoring.js", () => ({
      trackToolUsage: mock(async () => {}),
    }));

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    await mockFs.ensureDir(path.join(process.env.STIGMERGY_CORE_PATH, "agents"));

    // Create a dummy rbac.yml to prevent ENOENT errors during Engine initialization
    const governanceDir = path.join(process.env.STIGMERGY_CORE_PATH, "governance");
    await mockFs.ensureDir(governanceDir);
    await mockFs.promises.writeFile(path.join(governanceDir, "rbac.yml"), "users:\n  - key: test-key\n    role: admin\nroles:\n  admin:\n    - '*' ");

    const mockDebuggerAgentContent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools:
    - "coderag.*"
    - "file_system.*"
\`\`\`
`;
    await mockFs.promises.writeFile(
      path.join(process.env.STIGMERGY_CORE_PATH, "agents", "debugger.md"),
      mockDebuggerAgentContent
    );

    stateManager = new GraphStateManager(projectRoot);

    const mockUnifiedIntelligenceService = {
      semanticSearch: mockSemanticSearch,
      calculateMetrics: mockCalculateMetrics,
      findArchitecturalIssues: mockFindArchitecturalIssues,
    };

    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      const finalOptions = {
        ...options,
        unifiedIntelligenceService: mockUnifiedIntelligenceService,
      };
      const executor = await realCreateExecutor(engineInstance, ai, finalOptions, fs);
      return executor;
    };

    // DEFINITIVE FIX: The mock config MUST match the structure the Engine constructor expects.
    const mockConfig = {
      security: { allowedDirs: ["src", "public"], generatedPaths: ["dist"] },
      max_session_cost: 1.0,
      custom_agents_path: null,
      collaboration: {
        mode: "single-player",
      },
      ai: {
        tiers: {
          reasoning_tier: "mock-model",
          execution_tier: "mock-model",
        },
        providers: {
          "mock-provider": {
            label: "Mock Provider",
            models: ["mock-model"],
          },
        },
      },
    };

    engine = new Engine({
      broadcastEvent: mock(),
      projectRoot: projectRoot,
      stateManager,
      config: mockConfig, // Inject the complete mock config
      startServer: false,
      _test_fs: mockFs,
      _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
      _test_executorFactory: testExecutorFactory,
      _test_streamText: true, // Prevent actual AI calls
    });

    await engine.toolExecutorPromise;

    execute = engine.toolExecutor.execute;
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    if (stateManager) {
      await stateManager.closeDriver();
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
