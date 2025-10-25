import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import { OperationalError } from "../../../utils/errorHandler.js";
import mockFs, { vol } from "../../mocks/fs.js";
import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js";
// import { Engine } from '../../../engine/server.js'; // Deferred import
import { createExecutor } from "../../../engine/tool_executor.js";

describe("Tool Executor Path Resolution and Security", () => {
  let mockEngine;
  let execute;
  const projectRoot = "/test-project-security";
  let stateManager;

  beforeEach(async () => {
    vol.reset(); // PRISTINE STATE: Reset filesystem
    mock.restore(); // PRISTINE STATE: Restore mocks

    // Mock modules for isolation
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          security: {
            allowedDirs: ["src", "public"],
            generatedPaths: ["dist"],
          },
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock-model" } },
          providers: { mock_provider: { api_key: "mock-key" } },
        }),
      },
    }));
    const mockTrajectoryRecorder = {
      startRecording: mock(),
      logEvent: mock(),
      finalizeRecording: mock(),
    };
    mock.module("../../../services/trajectory_recorder.js", () => ({
      TrajectoryRecorder: mock(() => mockTrajectoryRecorder),
    }));
    mock.module("../../../services/model_monitoring.js", () => ({
      trackToolUsage: mock(),
      appendLog: mock(),
    }));

    // Setup mock project structure
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentDir, { recursive: true });
    await mockFs.promises.mkdir(path.join(projectRoot, "src"), { recursive: true });
    await mockFs.promises.mkdir(path.join(projectRoot, "dist"), { recursive: true });

    // Create mock agent files
    const agentFiles = {
      "@test-agent.md": 'id: "@test-agent"\\nengine_tools: ["file_system.*"]',
      "@guardian.md": 'id: "@guardian"\\nengine_tools: ["file_system.*"]',
      "auditor.md": 'id: "auditor"\\nengine_tools: ["file_system.readFile"]',
    };
    for (const [filename, content] of Object.entries(agentFiles)) {
      await mockFs.promises.writeFile(
        path.join(agentDir, filename),
        `\`\`\`yaml\\nagent:\\n  ${content}\\n\`\`\``
      );
    }

    // DYNAMIC IMPORT: Import Engine *after* its dependencies have been mocked.
    const { Engine } = await import("../../../engine/server.js");
    const stateManager = new GraphStateManager(projectRoot);

    mockEngine = new Engine({
      projectRoot,
      stateManager,
      startServer: false,
      _test_fs: mockFs,
      _test_unifiedIntelligenceService: {},
      trajectoryRecorder: mockTrajectoryRecorder, // DEFINITIVE FIX: Inject the mock recorder.
    });

    // THIS IS THE CRITICAL FIX:
    // Explicitly wait for the toolExecutor promise to resolve.
    await mockEngine.toolExecutorPromise;

    // Now that the executor is guaranteed to exist, we can safely access its methods.
    execute = mockEngine.toolExecutor.execute;

    // Mock the triggerAgent to always return a compliant audit for this test suite
    mockEngine.triggerAgent = mock(() => Promise.resolve(JSON.stringify({ compliant: true })));
  });

  afterEach(async () => {
    mock.restore(); // PRISTINE STATE: Restore mocks
    if (mockEngine) {
      await mockEngine.stop(); // PRISTINE STATE: Stop the engine
    }
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("should allow writing to a safe directory", async () => {
    const filePath = "src/allowed.js";
    await execute("file_system.writeFile", { path: filePath, content: "safe" }, "@test-agent");
    const content = await mockFs.promises.readFile(path.join(projectRoot, filePath), "utf-8");
    expect(content).toBe("safe");
  });

  test("should prevent writing to an unsafe directory", async () => {
    const promise = execute(
      "file_system.writeFile",
      { path: "unsafe/file.js", content: "unsafe" },
      "@test-agent"
    );
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
    const content = await mockFs.promises.readFile(path.join(projectRoot, coreFilePath), "utf-8");
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
    // Override the default mock to return a non-compliant response for this specific test
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
