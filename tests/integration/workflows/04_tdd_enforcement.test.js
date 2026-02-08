import { describe, it, expect, beforeEach, afterEach, mock } from "bun:test";
import { Engine } from "../../../engine/server.js";
import { GraphStateManager } from "../../../services/GraphStateManager.js";
import mockFs, { vol } from "../../mocks/fs.js";
import path from "path";
import yaml from "js-yaml";
import { createExecutor } from "../../../engine/tool_executor.js";

const CWD = "/test-project";
const CORE_PATH = path.join(CWD, ".stigmergy-core");

mock.module("../../../services/unified_intelligence.js", () => ({
  unifiedIntelligenceService: {
    getCompletion: mock(),
  },
}));

describe("TDD Enforcement Workflow", () => {
  let engine;
  let stateManager;
  const debuggerDelegationSpy = mock();

  beforeEach(async () => {
    vol.reset();
    debuggerDelegationSpy.mockClear();

    const mockAgentFiles = {
      "dispatcher.md": "```yaml\n" + yaml.dump({ agent: { id: "dispatcher", persona: { role: "test", identity: "test" }, engine_tools: ["stigmergy.task", "file_system.readFile"] } }) + "\n```",
      "executor.md": "```yaml\n" + yaml.dump({ agent: { id: "executor", persona: { role: "test", identity: "test" }, engine_tools: ["file_system.writeFile"] } }) + "\n```",
      "qa.md": "```yaml\n" + yaml.dump({ agent: { id: "qa", persona: { role: "test", identity: "test" }, engine_tools: ["file_system.pathExists", "stigmergy.task"] } }) + "\n```",
      "debugger.md": "```yaml\n" + yaml.dump({ agent: { id: "debugger", persona: { role: "test", identity: "test" }, engine_tools: [] } }) + "\n```",
      "auditor.md": "```yaml\n" + yaml.dump({ agent: { id: "auditor", persona: { role: "test", identity: "test" } } }) + "\n```",
    };
    // Create mock files in the in-memory filesystem
    const agentsPath = path.join(CORE_PATH, "agents");
    await mockFs.promises.mkdir(agentsPath, { recursive: true });
    for (const [fileName, content] of Object.entries(mockAgentFiles)) {
        await mockFs.promises.writeFile(path.join(agentsPath, fileName), content);
    }
    const rbacConfig = { users: [{ key: 'test-key', role: 'admin' }], roles: { admin: ['mission:run'] } };
    const rbacPath = path.join(CORE_PATH, 'governance');
    await mockFs.promises.mkdir(rbacPath, { recursive: true });
    await mockFs.promises.writeFile(path.join(rbacPath, 'rbac.yml'), yaml.dump(rbacConfig));

    stateManager = new GraphStateManager(CWD);
    await stateManager.initialize();

    const config = {
      llm_providers: { default: "mock", mock: { type: "openai", api_key: "test", models: { reasoning_tier: "gpt-4" } } },
      security: { allowedDirs: ['src'] }
    };

    // THE DEFINITIVE FIX: The Mock-Aware Executor Factory
    const testExecutorFactory = async (engine, ai, options, fsProvider) => {
        const executor = await createExecutor(engine, ai, options, fsProvider);
        const originalExecute = executor.execute;
        executor.execute = async (toolName, args, agentName, workingDirectory) => {
            if (toolName === 'stigmergy.task' && args.subagent_type === '@debugger') {
                debuggerDelegationSpy(args);
            }
            return originalExecute(toolName, args, agentName, workingDirectory);
        };
        return executor;
    };

    engine = new Engine({
      projectRoot: CWD,
      corePath: CORE_PATH,
      stateManager,
      startServer: false,
      config,
      _test_fs: mockFs,
      _test_executorFactory: testExecutorFactory, // Inject the factory here
    });
  });

  afterEach(async () => {
    if (engine) await engine.stop();
    mock.restore();
  });

  it("should fail QA check and delegate to debugger if a test file is not created", async () => {
    const plan = {
      tasks: [
        { id: "task-1", status: "PENDING", description: "Create a new feature file without a test.", agent: "@executor" },
        { id: "task-2", status: "PENDING", description: "Verify the implementation.", agent: "@qa", dependencies: ["task-1"] }
      ],
    };
    const planContent = "```yaml\n" + yaml.dump(plan) + "\n```";

    let callCount = 0;
    engine._test_streamText = async ({ messages }) => {
        callCount++;
        const lastMessage = messages[messages.length - 1].content;

        if (callCount === 1) return { toolCalls: [{ toolName: "stigmergy.task", args: { subagent_type: "@executor", description: "..." } }] };
        if (callCount === 2) return { toolCalls: [{ toolName: "file_system.writeFile", args: { path: "src/feature.js", content: "test" } }] };
        if (callCount === 3) return { text: JSON.stringify({ compliant: true }) }; // Auditor
        if (callCount === 4) return { text: "File written." }; // Executor finishes
        if (callCount === 5) return { toolCalls: [{ toolName: "stigmergy.task", args: { subagent_type: "@qa", description: "..." } }] };
        if (callCount === 6) return { toolCalls: [{ toolName: 'file_system.pathExists', args: { path: 'src/feature.test.js' } }] };
        if (callCount === 7) return { toolCalls: [{ toolName: 'stigmergy.task', args: { subagent_type: '@debugger', description: "TDD Violation" } }] };
        if (callCount === 8) return { text: "Debugger acknowledged.", finishReason: "stop" }; // Debugger finishes

        return { text: "Unexpected call.", finishReason: "stop" };
    };

    const dispatcherPrompt = `The plan is as follows:\n${planContent}\nPlease execute it.`;
    await engine.triggerAgent("@dispatcher", dispatcherPrompt);

    expect(debuggerDelegationSpy).toHaveBeenCalled();
    const delegationArgs = debuggerDelegationSpy.mock.calls[0][0];
    expect(delegationArgs.description).toInclude("TDD Violation");
  });
});