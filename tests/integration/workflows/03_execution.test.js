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
      stateManager,
      startServer: false,
      _test_streamText: mockStreamText,
      _test_createExecutor: (eng, ai, opts) => createExecutor(eng, ai, { ...opts, _test_fs: mockFs }),
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
    const dispatcherReadPlanResponse = { text: "Reading plan.", toolCalls: [{ toolName: 'file_system.readFile', args: { path: 'plan.md' }, toolCallId: '1' }], finishReason: 'tool-calls' };
    const dispatcherDelegateResponse = { text: "Delegating to executor.", toolCalls: [{toolName: 'stigmergy.task', args: { subagent_type: '@executor', description: 'Execute task 1' }, toolCallId: '2'}], finishReason: 'tool-calls' };
    const dispatcherFinalResponse = { text: "Done.", toolCalls: [], finishReason: 'stop' };

    mockStreamText
        .mockResolvedValueOnce(dispatcherReadPlanResponse)
        .mockResolvedValueOnce(dispatcherDelegateResponse)
        .mockResolvedValueOnce(dispatcherFinalResponse);

    const executorWriteFileResponse = { text: "Writing file.", toolCalls: [{ toolName: 'file_system.writeFile', args: { path: 'src/example.js', content: 'console.log("hello");' }, toolCallId: '3' }], finishReason: 'tool-calls' };
    const executorFinalResponse = { text: "Done.", toolCalls: [], finishReason: 'stop' };

    const originalTriggerAgent = Engine.prototype.triggerAgent;
    const mockTriggerAgent = mock(async (agentId, prompt) => {
        if (agentId === '@executor') {
            mockStreamText
                .mockResolvedValueOnce(executorWriteFileResponse)
                .mockResolvedValueOnce(executorFinalResponse);
        }
        return await originalTriggerAgent.call(engine, agentId, prompt);
    });
    engine.triggerAgent = mockTriggerAgent;


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
