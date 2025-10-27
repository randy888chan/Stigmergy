import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import { OperationalError } from "../../../utils/errorHandler.js";
import mockFs, { vol } from "../../mocks/fs.js";
// import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js"; // DEFERRED
// import { Engine } from '../../../engine/server.js'; // DEFERRED

describe("Tool Executor Path Resolution and Security", () => {
  let mockEngine;
  let execute;
  const projectRoot = "/test-project-security";
  let stateManager;

  beforeEach(async () => {
    vol.reset();
    mock.restore();

    // DEFINITIVE FIX: Mock the config file dependency BEFORE any module that might import it is loaded.
    mock.module("../../../stigmergy.config.js", () => ({
      default: {
        security: {
          allowedDirs: ["src", "public", ".stigmergy-core"],
          generatedPaths: ["dist"],
        },
        custom_agents_path: null,
      },
    }));

    // Mock other services as before
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
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
    }));

    // Set up mock project structure
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentDir, { recursive: true });
    await mockFs.promises.mkdir(path.join(projectRoot, "src"), { recursive: true });
    await mockFs.promises.mkdir(path.join(projectRoot, "dist"), { recursive: true });

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

    // DYNAMIC IMPORT: Load modules that depend on the mocked config *after* the mock is in place.
    const { Engine } = await import("../../../engine/server.js");
    const { GraphStateManager } = await import(
      "../../../src/infrastructure/state/GraphStateManager.js"
    );

    // --- DEFINITIVE FIX: The Singleton Mismatch ---
    // The test MUST use the SAME instance of the state manager that the engine uses.
    // By creating it here and injecting it, we ensure they are the same.
    const stateManager = new GraphStateManager(projectRoot);

    mockEngine = new Engine({
      projectRoot,
      stateManager, // Inject the state manager
      startServer: false,
      _test_fs: mockFs,
      _test_unifiedIntelligenceService: {},
      trajectoryRecorder: mockTrajectoryRecorder,
    });

    await mockEngine.toolExecutorPromise;
    execute = mockEngine.toolExecutor.execute;
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
