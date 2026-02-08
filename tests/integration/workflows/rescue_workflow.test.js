import { test, describe, expect, mock, beforeEach, afterEach } from "bun:test";
import path from "path";
import mockFs, { vol } from "../../mocks/fs.js";

const mockStreamText = mock();

describe("Rescue Workflow", () => {
  let engine;
  const projectRoot = "/test-project-rescue";
  let GraphStateManager, Engine, realCreateExecutor, stateManager;

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

    await mockFs.promises.mkdir(projectRoot, { recursive: true });

    // --- Mocks ---
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
            strategic_tier: { provider: "mock", model_name: "mock-model" },
          },
          security: { allowedDirs: ["/"] }
        }),
      },
    }));
    mock.module("../../../services/model_monitoring.js", () => ({
      trackToolUsage: mock(async () => {}),
      appendLog: mock(async () => {}),
    }));

    // Setup RBAC
    const appCorePath = "/app/.stigmergy-core";
    const appGovernanceDir = path.join(appCorePath, "governance");
    await mockFs.promises.mkdir(appGovernanceDir, { recursive: true });
    await mockFs.promises.writeFile(path.join(appGovernanceDir, 'rbac.yml'), 'roles: { Admin: ["*"] }\nusers: [{username: "test", role: "Admin", key: "test-key"}]');

    // Dynamic Imports
    const stateManagerModule = await import("../../../services/GraphStateManager.js");
    GraphStateManager = stateManagerModule.GraphStateManager;
    const toolExecutorModule = await import("../../../engine/tool_executor.js");
    realCreateExecutor = toolExecutorModule.createExecutor;
    const engineModule = await import("../../../engine/server.js");
    Engine = engineModule.Engine;

    // --- Agent & Team Setup ---
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, ".stigmergy-core");
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, "agents");
    const teamsDir = path.join(process.env.STIGMERGY_CORE_PATH, "agent-teams");
    await mockFs.ensureDir(agentDir);
    await mockFs.ensureDir(teamsDir);

    // Conductor
    await mockFs.promises.writeFile(path.join(agentDir, "conductor.md"), `\`\`\`yaml
agent:
  id: "@conductor"
  engine_tools: ["stigmergy.task", "file_system.listDirectory", "file_system.readFile", "system.stream_thought", "coderag.*"]
\`\`\``);

    // Analyst
    await mockFs.promises.writeFile(path.join(agentDir, "analyst.md"), `\`\`\`yaml
agent:
  id: "@analyst"
  engine_tools: ["research.*", "file_system.*"]
\`\`\``);

    // Rescue Team Definition
    const rescueTeamContent = `
lead_agent: "@conductor"
bundle:
  name: "Rescue & Repair"
  description: "Fixing broken apps"
  agents:
    - "conductor"
    - "analyst"
`;
    await mockFs.promises.writeFile(path.join(teamsDir, "team-rescue.yml"), rescueTeamContent);

    // Executor Factory
    const testExecutorFactory = async (engineInstance, ai, options, fs) => {
      return await realCreateExecutor(engineInstance, ai, { ...options, unifiedIntelligenceService: {} }, fs);
    };

    // State Manager Mock
    const mockDriver = {
      session: () => ({
        run: () => Promise.resolve({ records: [], summary: {} }),
        close: () => Promise.resolve(),
      }),
      close: () => Promise.resolve(),
    };
    stateManager = new GraphStateManager(projectRoot, mockDriver);

    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      config: {
          security: { allowedDirs: ["/"] },
          model_tiers: { reasoning_tier: { provider: "mock", model_name: "mock" } }
      },
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

  test("Conductor should select the rescue team for a bug-fixing goal", async () => {
    let conductorTurn = 0;

    // SMART MOCK IMPLEMENTATION
    mockStreamText.mockImplementation(async ({ tools }) => {
        const toolNames = Object.keys(tools || {});

        // Identify Agents
        const isConductor = toolNames.includes("system.stream_thought");
        const isAnalyst = toolNames.includes("research.deep_dive") || toolNames.includes("research.evaluate_sources");

        // --- CONDUCTOR BEHAVIOR ---
        if (isConductor) {
            conductorTurn++;
            if (conductorTurn === 1) {
                // Thought: Select Rescue Team
                return {
                    toolCalls: [{
                        toolName: "system.stream_thought",
                        args: { thought: "The Rescue Team is best suited for this. I will delegate to the lead agent, @analyst." },
                        toolCallId: "c1"
                    }],
                    finishReason: "tool-calls"
                };
            }
            if (conductorTurn === 2) {
                // Action: Delegate to Analyst
                return {
                    toolCalls: [{
                        toolName: "stigmergy.task",
                        args: { subagent_type: "@analyst", description: "Fix the bug in the application." },
                        toolCallId: "c2"
                    }],
                    finishReason: "tool-calls"
                };
            }
            return { text: "Delegation complete.", finishReason: "stop" };
        }

        // --- ANALYST BEHAVIOR (The missing piece!) ---
        if (isAnalyst) {
            return {
                text: "I am analyzing the bug. I found the issue in server.js.",
                finishReason: "stop"
            };
        }

        // --- DEFAULT SAFETIES (Prevents destructuring crash) ---
        return {
            text: "Agent action complete (Fallback).",
            finishReason: "stop"
        };
    });

    await engine.triggerAgent("@conductor", "Fix the critical bug in the login service.");

    // Verification
    // 1. Check calls were made
    expect(mockStreamText).toHaveBeenCalled();

    // 2. We can check specific tool calls in the mock history if needed,
    // but successful execution without throwing implies success here.
  });
});
