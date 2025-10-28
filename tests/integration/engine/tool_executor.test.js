import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import { vol } from "memfs";

// This is the final, stable version of the test suite.
// It combines the Async-First Mocking and Dependency Injection patterns
// to ensure complete test isolation and stability.

describe("Tool Executor Security (Definitive Fix)", () => {
  let mockEngine;
  let execute;
  const projectRoot = "/test-project-security";
  let mockFs;
  let OperationalError;
  let stateManager;

  beforeEach(async () => {
    vol.reset();
    mock.restore();

    mockFs = (await import("../../mocks/fs.js")).default;
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);

    mock.module("../../../services/tracing.js", () => ({
      startTracing: mock(),
      sdk: { shutdown: mock() },
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

    const { Engine } = await import("../../../engine/server.js");
    const { GraphStateManager } = await import(
      "../../../src/infrastructure/state/GraphStateManager.js"
    );
    const errorHandlerModule = await import("../../../utils/errorHandler.js");
    OperationalError = errorHandlerModule.OperationalError;

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(path.join(projectRoot, "src"));
    mockFs.ensureDirSync(path.join(projectRoot, "dist"));
    mockFs.ensureDirSync(path.join(projectRoot, "unsafe"));

    const agentFiles = {
      "auditor.md": `
\`\`\`yaml
agent:
  id: "auditor"
\`\`\`
`,
      "@test-agent.md": `
\`\`\`yaml
agent:
  id: "@test-agent"
  engine_tools:
    - "file_system.writeFile"
\`\`\`
`,
      "@guardian.md": `
\`\`\`yaml
agent:
  id: "@guardian"
  engine_tools:
    - "file_system.writeFile"
\`\`\`
`,
    };
    for (const [filename, content] of Object.entries(agentFiles)) {
      mockFs.writeFileSync(path.join(agentDir, filename), content);
    }

    const mockDriver = {
      session: () => ({
        run: () => Promise.resolve({ records: [] }),
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
      off: mock(),
      on: mock(),
    };
    stateManager = new GraphStateManager(projectRoot, mockDriver);

    // DEFINITIVE FIX: The mock config MUST match the structure the Engine constructor expects.
    // The constructor accesses `config.ai.tiers`, so that structure must be present.
    const mockConfig = {
      security: {
        allowedDirs: ["src", "public", ".stigmergy-core", "dist"],
        generatedPaths: ["dist"],
      },
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

    mockEngine = new Engine({
      projectRoot,
      stateManager,
      config: mockConfig, // Inject the complete mock config
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: true, // Prevent actual AI calls
    });

    await mockEngine.toolExecutorPromise;
    execute = mockEngine.toolExecutor.execute;
    mockEngine.triggerAgent = mock(() => Promise.resolve(JSON.stringify({ compliant: true })));
  });

  afterEach(async () => {
    if (mockEngine) await mockEngine.stop();
    if (stateManager) {
      await stateManager.closeDriver();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("should allow writing to a safe directory", async () => {
    const filePath = "src/allowed.js";
    await execute("file_system.writeFile", { path: filePath, content: "safe" }, "@test-agent");
    const content = mockFs.readFileSync(path.join(projectRoot, filePath), "utf-8");
    expect(content).toBe("safe");
  });

  test("should prevent writing to an unsafe directory", async () => {
    const promise = execute(
      "file_system.writeFile",
      { path: "unsafe/file.js", content: "unsafe" },
      "@test-agent"
    );
    await expect(promise).rejects.toThrow(OperationalError);
    await expect(promise).rejects.toThrow(/Access restricted to unsafe directory/);
  });

  test("should prevent path traversal", async () => {
    const promise = execute(
      "file_system.writeFile",
      { path: "../traversal.js", content: "unsafe" },
      "@test-agent"
    );
    await expect(promise).rejects.toThrow(/Security violation: Path traversal attempt/);
  });

  test("should prevent writing to a generated code path", async () => {
    const promise = execute(
      "file_system.writeFile",
      { path: "dist/bundle.js", content: "generated" },
      "@test-agent"
    );
    await expect(promise).rejects.toThrow(/is inside a protected 'generated' directory/);
  });

  test("should allow @guardian to write to core files", async () => {
    const coreFilePath = ".stigmergy-core/some-config.yml";
    await execute(
      "file_system.writeFile",
      { path: coreFilePath, content: "core-setting" },
      "@guardian"
    );
    const content = mockFs.readFileSync(path.join(projectRoot, coreFilePath), "utf-8");
    expect(content).toBe("core-setting");
  });

  test("should prevent non-@guardian agents from writing to core files", async () => {
    const coreFilePath = ".stigmergy-core/some-config.yml";
    const promise = execute(
      "file_system.writeFile",
      { path: coreFilePath, content: "core-setting" },
      "@test-agent"
    );
    await expect(promise).rejects.toThrow(
      /Only the @guardian or @metis agents may modify core system files/
    );
  });

  test("should block a tool call if the @auditor deems it non-compliant", async () => {
    mockEngine.triggerAgent = mock(() =>
      Promise.resolve(
        JSON.stringify({
          compliant: false,
          reason: "Violation of test principle.",
        })
      )
    );

    const filePath = "src/should-be-blocked.js";
    const promise = execute(
      "file_system.writeFile",
      { path: filePath, content: "blocked" },
      "@test-agent"
    );

    await expect(promise).rejects.toThrow(OperationalError);
    await expect(promise).rejects.toThrow(
      /Action blocked by @auditor: Violation of test principle./
    );
  });
});
