import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

const mockStreamText = mock();

describe("Execution Workflow: @dispatcher and @executor", () => {
  let engine;
  const projectRoot = "/test-project-exec";
  let stateManager;
  let mockDbState = { project_status: "AWAITING_USER_INPUT" };

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    mockDbState = { project_status: "AWAITING_USER_INPUT" };

    await mockFs.promises.mkdir(projectRoot, { recursive: true });

    mock.module("../../../services/tracing.js", () => ({ sdk: { shutdown: () => Promise.resolve() } }));
    mock.module("../../../services/unified_intelligence.js", () => ({ unifiedIntelligenceService: {} }));
    mock.module("dotenv", () => ({ config: mock() }));
    mock.module("fs", () => mockFs);
    mock.module("fs-extra", () => mockFs);
    mock.module("ai", () => ({ streamText: mockStreamText }));
    mock.module("../../../services/config_service.js", () => ({
      configService: {
        getConfig: () => ({
          model_tiers: {
            reasoning_tier: { provider: "mock", model_name: "mock-model" },
            execution_tier: { provider: "mock", model_name: "mock-model" },
          },
          security: { allowedDirs: ["/"] }
        }),
      },
    }));
    mock.module("../../../services/model_monitoring.js", () => ({ trackToolUsage: mock() }));

    const { Engine } = await import("../../../engine/server.js");
    const { GraphStateManager } = await import("../../../engine/infrastructure/state/GraphStateManager.js");
    const { createExecutor: realCreateExecutor } = await import("../../../engine/tool_executor.js");

    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentDir, { recursive: true });

    await mockFs.promises.writeFile(path.join(agentDir, "dispatcher.md"), `\`\`\`yaml\nagent:\n  id: "@dispatcher"\n  engine_tools: ["file_system.*", "stigmergy.task", "system.*"]\n\`\`\``);
    await mockFs.promises.writeFile(path.join(agentDir, "executor.md"), `\`\`\`yaml\nagent:\n  id: "@executor"\n  engine_tools: ["file_system.*"]\n\`\`\``);
    await mockFs.promises.writeFile(path.join(agentDir, "auditor.md"), `\`\`\`yaml\nagent:\n  id: "@auditor"\n\`\`\``);

    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      return await realCreateExecutor(engineInstance, ai, { ...options, unifiedIntelligenceService: {} }, fs);
    };

    const mockDriver = {
      session: () => ({ run: () => Promise.resolve({ records: [] }), close: () => Promise.resolve() }),
      close: () => Promise.resolve(),
    };

    stateManager = new GraphStateManager(projectRoot, mockDriver);
    // This is the critical fix: the state manager must be initialized.
    await stateManager.initialize();
    stateManager.updateStatus = async ({ newStatus }) => {
      mockDbState.project_status = newStatus;
      return { success: true };
    };
    stateManager.getState = async () => mockDbState;

    const { configService } = await import("../../../services/config_service.js");
    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      config: configService.getConfig(),
      startServer: false,
      _test_fs: mockFs,
      _test_streamText: mockStreamText,
      _test_executorFactory: testExecutorFactory,
    });
  });

  afterEach(async () => {
    if (engine) await engine.stop();
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test("Dispatcher should read plan and delegate to executor", async () => {
    let dispatcherTurn = 0;
    let executorTurn = 0;
    let auditorTurn = 0;

    mockStreamText.mockImplementation(async ({ messages, tools }) => {
        const toolNames = Object.keys(tools || {});
        const isDispatcher = toolNames.includes("stigmergy.task");
        const isExecutor = toolNames.includes("file_system.writeFile") && !isDispatcher;
        const isAuditor = !tools || toolNames.length === 0;

        if (isAuditor) {
            auditorTurn++;
            console.log(`[Test Mock] AUDITOR Turn ${auditorTurn}`);
            return { text: JSON.stringify({ compliant: true }), finishReason: "stop" };
        }

        if (isExecutor) {
            executorTurn++;
            console.log(`[Test Mock] EXECUTOR Turn ${executorTurn}`);
            if (executorTurn === 1) {
                return { toolCalls: [{ toolName: "file_system.writeFile", args: { path: "src/example.js", content: "code" }, toolCallId: "ex1" }], finishReason: "tool-calls" };
            }
            return { text: "File written.", finishReason: "stop" };
        }

        if (isDispatcher) {
            dispatcherTurn++;
            console.log(`[Test Mock] DISPATCHER Turn ${dispatcherTurn}`);
            if (dispatcherTurn === 1) {
                 return { toolCalls: [{ toolName: "stigmergy.task", args: { subagent_type: "@executor", description: "do it" }, toolCallId: "d3" }], finishReason: "tool-calls" };
            }
            if (dispatcherTurn === 2) {
                 return { toolCalls: [{ toolName: "system.updateStatus", args: { newStatus: "PLAN_EXECUTED" }, toolCallId: "d4" }], finishReason: "tool-calls" };
            }
            return { text: "Done.", finishReason: "stop" };
        }

        console.log("[Test Mock] FALLBACK - Unknown Agent");
        return { text: "Fallback response.", finishReason: "stop" };
    });

    await mockFs.promises.writeFile(path.join(projectRoot, "plan.md"), "task list");
    await mockFs.promises.mkdir(path.join(projectRoot, "src"), { recursive: true });

    await engine.triggerAgent("@dispatcher", "Go.");

    // NEW: Poll for state change instead of immediate check
    const pollForState = async () => {
        for (let i = 0; i < 20; i++) {
            const state = await engine.stateManager.getState();
            if (state.project_status === "PLAN_EXECUTED") return state;
            await new Promise(r => setTimeout(r, 50));
        }
        return await engine.stateManager.getState();
    };

    const finalState = await pollForState();
    expect(finalState.project_status).toBe("PLAN_EXECUTED");
  });
});
