import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import { vol } from "memfs";

describe("Tool Executor Human Approval", () => {
  let mockEngine;
  let execute;
  const projectRoot = "/test-project-approval";
  let mockFs;
  let OperationalError;
  let stateManager;
  let Engine;
  let GraphStateManager;

  const mockConfig = {
    security: {
      allowedDirs: ["src"],
    },
    max_session_cost: 1.0,
    custom_agents_path: null,
    collaboration: { mode: "single-player" },
    ai: {
        tiers: { reasoning_tier: "mock-model" },
        providers: { "mock-provider": { models: ["mock-model"] } },
    }
  };

  beforeEach(async () => {
    vol.reset();
    mock.restore();

    await vol.promises.mkdir(projectRoot, { recursive: true });
    mockFs = (await import("../../mocks/fs.js")).default;
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);

    mock.module("../../../services/tracing.js", () => ({
      startTracing: mock(),
      sdk: { shutdown: mock() },
      trace: {
        getTracer: () => ({
          startActiveSpan: (name, fn) => fn({ setAttribute: () => {}, recordException: () => {}, setStatus: () => {}, end: () => {} }),
        }),
      },
      SpanStatusCode: { ERROR: "ERROR" },
    }));

    Engine = (await import("../../../engine/server.js")).Engine;
    GraphStateManager = (await import("../../../engine/infrastructure/state/GraphStateManager.js")).GraphStateManager;
    const errorHandlerModule = await import("../../../utils/errorHandler.js");
    OperationalError = errorHandlerModule.OperationalError;

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(path.join(projectRoot, "src"));

    const agentFiles = {
      "auditor.md": '```yaml\nagent:\n  id: "auditor"\n```',
      "@test-agent.md": '```yaml\nagent:\n  id: "@test-agent"\n  engine_tools:\n    - "file_system.writeFile"\n    - "shell.execute"\n```',
    };
    for (const [filename, content] of Object.entries(agentFiles)) {
      mockFs.writeFileSync(path.join(agentDir, filename), content);
    }

    stateManager = new GraphStateManager(projectRoot, {
      session: () => ({ run: () => Promise.resolve({ records: [] }), close: () => Promise.resolve() }),
      close: () => Promise.resolve(),
      off: mock(),
      on: mock(),
    });

    mockEngine = new Engine({
      projectRoot,
      stateManager,
      config: mockConfig,
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: true,
    });
    mockEngine.broadcastEvent = mock();

    await mockEngine.toolExecutorPromise;
    execute = mockEngine.toolExecutor.execute;
  });

  afterEach(async () => {
    if (mockEngine) await mockEngine.stop();
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("should request human approval when auditor returns requires_human_approval: true", async () => {
    // 1. Mock Auditor Response
    mockEngine.triggerAgent = mock((agentId) => {
        if (agentId === "auditor") {
            return Promise.resolve(JSON.stringify({
                compliant: true,
                requires_human_approval: true
            }));
        }
        return Promise.resolve("OK");
    });

    // 2. Mock Human Approval Response
    setTimeout(() => {
        const reqId = [...mockEngine.pendingApprovals.keys()][0];
        if (reqId) {
            mockEngine.pendingApprovals.get(reqId)("approved");
            mockEngine.pendingApprovals.delete(reqId);
        }
    }, 50);

    const filePath = "src/approved-by-human.js";
    await execute("file_system.writeFile", { path: filePath, content: "human-says-yes" }, "@test-agent");

    const content = mockFs.readFileSync(path.join(projectRoot, filePath), "utf-8");
    expect(content).toBe("human-says-yes");
  });

  test("should block tool call if human rejects approval", async () => {
    // 1. Mock Auditor Response
    mockEngine.triggerAgent = mock((agentId) => {
        if (agentId === "auditor") {
            return Promise.resolve(JSON.stringify({
                compliant: true,
                requires_human_approval: true
            }));
        }
        return Promise.resolve("OK");
    });

    // 2. Mock Human REJECTION
    setTimeout(() => {
        const reqId = [...mockEngine.pendingApprovals.keys()][0];
        if (reqId) {
            mockEngine.pendingApprovals.get(reqId)("rejected");
            mockEngine.pendingApprovals.delete(reqId);
        }
    }, 50);

    const filePath = "src/rejected-by-human.js";
    const promise = execute("file_system.writeFile", { path: filePath, content: "human-says-no" }, "@test-agent");

    await expect(promise).rejects.toThrow(/Action rejected by human operator/);
  });
});
