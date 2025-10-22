import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

const mockStreamText = mock(async () => ({ text: 'Test response', toolCalls: [], finishReason: 'stop' }));

describe('Execution Workflow: @dispatcher and @executor', () => {
  let engine;
  let Engine, createExecutor;
  const projectRoot = '/test-project-exec';

  beforeEach(async () => {
    vol.reset(); // PRISTINE STATE: Reset filesystem

    // Mock modules for isolation
    mock.module('fs', () => mockFs);
    mock.module('fs-extra', () => mockFs);
    mock.module('ai', () => ({ streamText: mockStreamText }));
    mock.module('../../../services/config_service.js', () => ({
        configService: {
            getConfig: () => ({
                model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                providers: { mock_provider: { api_key: 'mock-key' } }
            }),
        },
    }));
    mock.module('../../../services/model_monitoring.js', () => ({
        trackToolUsage: mock(async () => {}),
        appendLog: mock(async () => {}),
    }));

    // Dynamically import AFTER mocks are set up
    Engine = (await import('../../../engine/server.js')).Engine;
    createExecutor = (await import('../../../engine/tool_executor.js')).createExecutor;

    // Setup mock project structure in the pristine filesystem
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
    await mockFs.promises.mkdir(agentDir, { recursive: true });

    const dispatcherContent = `
\`\`\`yaml
agent:
  id: "@dispatcher"
  engine_tools: ["file_system.*", "stigmergy.task"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, '@dispatcher.md'), dispatcherContent);
    const executorContent = `
\`\`\`yaml
agent:
  id: "@executor"
  engine_tools: ["file_system.*"]
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, '@executor.md'), executorContent);

    // PRISTINE STATE: Create a new Engine for each test
    const stateManager = new GraphStateManager(projectRoot);
    engine = new Engine({
      projectRoot,
      corePath: process.env.STIGMERGY_CORE_PATH,
      stateManager,
      startServer: false,
      _test_streamText: mockStreamText,
      _test_fs: mockFs,
    });

    await engine.stateManager.updateStatus({ newStatus: 'AWAITING_USER_INPUT' });
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop(); // PRISTINE STATE: Stop the engine
    }
    mockStreamText.mockClear();
    mock.restore(); // PRISTINE STATE: Restore mocks
    delete process.env.STIGMERGY_CORE_PATH;
  });

  test('Dispatcher should read plan and delegate to executor', async () => {
    // This is the realistic, multi-turn conversation that the dispatcher agent follows.
    const dispatcherMockSequence = [
        // 1. First, the dispatcher reads the plan file.
        { text: "Okay, I will read the plan.", toolCalls: [{ toolName: 'file_system.readFile', args: { path: 'plan.md' }, toolCallId: '1' }], finishReason: 'tool-calls' },
        // 2. After reading, it delegates the task to the executor.
        { text: "The plan is clear. I will delegate the task to the @executor agent.", toolCalls: [{toolName: 'stigmergy.task', args: { subagent_type: '@executor', description: 'Execute task 1' }, toolCallId: '2'}], finishReason: 'tool-calls' },
        // 3. Finally, it confirms completion.
        { text: "Delegation complete. My job is done.", toolCalls: [], finishReason: 'stop' }
    ];

    // This is the realistic, multi-turn conversation for the executor agent.
    const executorMockSequence = [
        // 1. The executor receives the task and writes the file.
        { text: "I have received the task. I will write the file.", toolCalls: [{ toolName: 'file_system.writeFile', args: { path: 'src/example.js', content: 'console.log("hello");' }, toolCallId: '3' }], finishReason: 'tool-calls' },
        // 2. After writing, it confirms completion.
        { text: "File written successfully.", toolCalls: [], finishReason: 'stop' }
    ];

    // The mock must account for the full conversation, including the handoff.
    mockStreamText
        .mockResolvedValueOnce(dispatcherMockSequence[0])
        .mockResolvedValueOnce(dispatcherMockSequence[1])
        .mockResolvedValueOnce(dispatcherMockSequence[2])
        .mockResolvedValueOnce(executorMockSequence[0])
        .mockResolvedValueOnce(executorMockSequence[1]);

    const planContent = `
tasks:
  - id: "1"
    agent: "@executor"
    description: "Execute task 1"
    files_to_create_or_modify: ["src/example.js"]
`;
    await mockFs.promises.writeFile(path.join(projectRoot, 'plan.md'), planContent);
    await mockFs.promises.mkdir(path.join(projectRoot, 'src'), { recursive: true });

    await engine.triggerAgent('@dispatcher', 'Proceed with the plan.');

    const finalState = await engine.stateManager.getState();
    expect(finalState.project_status).toBe('PLAN_EXECUTED');

    const fileExists = await mockFs.pathExists(path.join(projectRoot, '.stigmergy/sandboxes/executor/src/example.js'));
    expect(fileExists).toBe(true);
  });
});
