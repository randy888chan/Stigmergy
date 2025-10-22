import { test, describe, expect, mock, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
// Do NOT import Engine or createExecutor statically
import { getTestStateManager } from '../../global_state.js';
import { Volume } from 'memfs';
import path from 'path';

// --- Definitive FS Mock ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);
const mockFs = { ...memfs };
mockFs.promises = memfs.promises;
mock.module('fs', () => mockFs);
mock.module('fs-extra', () => mockFs);


// --- Other Mocks ---
const mockStreamText = mock(async () => ({ text: 'Test response', toolCalls: [], finishReason: 'stop' }));
mock.module('ai', () => ({ streamText: mockStreamText }));

const mockConfigService = {
  getConfig: () => ({ model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } } }),
};
mock.module('../../../services/config_service.js', () => ({ configService: mockConfigService }));


describe('Execution Workflow: @dispatcher and @executor', () => {
  let engine;
  let stateManager;
  let Engine, createExecutor; // To be populated by dynamic import
  const projectRoot = '/test-project-exec';

  beforeAll(async () => {
    stateManager = getTestStateManager();
    await memfs.promises.mkdir(projectRoot, { recursive: true });
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
    await memfs.promises.mkdir(process.env.STIGMERGY_CORE_PATH, { recursive: true });
  });

  afterAll(async () => {
    await memfs.promises.rm(projectRoot, { recursive: true, force: true });
    delete process.env.STIGMERGY_CORE_PATH;
  });

  beforeEach(async () => {
    // DEFINITIVE FIX: Dynamically import modules AFTER mocks are set up.
    Engine = (await import('../../../engine/server.js')).Engine;
    createExecutor = (await import('../../../engine/tool_executor.js')).createExecutor;

    vol.reset();
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
    await memfs.promises.mkdir(agentDir, { recursive: true });

    const dispatcherContent = `
agent:
  id: "@dispatcher"
  engine_tools: ["file_system.*"]
`;
    await memfs.promises.writeFile(path.join(agentDir, '@dispatcher.md'), dispatcherContent);
    const executorContent = `
agent:
  id: "@executor"
  engine_tools: ["file_system.*"]
`;
    await memfs.promises.writeFile(path.join(agentDir, '@executor.md'), executorContent);

    engine = new Engine({
      projectRoot,
      stateManager,
      startServer: false,
      _test_streamText: mockStreamText,
      _test_createExecutor: (eng, ai, opts) => createExecutor(eng, ai, { ...opts, _test_fs: memfs }),
    });

    await engine.stateManager.updateStatus({ newStatus: 'AWAITING_USER_INPUT' });
  });

  afterEach(async () => {
    if (engine) {
      await engine.stop();
    }
    mockStreamText.mockClear();
    mock.restore();
  });

  test('Dispatcher should read plan and delegate to executor', async () => {
    const dispatcherReadPlanResponse = { text: "Reading plan.", toolCalls: [{ toolName: 'file_system.readFile', args: { path: path.join(projectRoot, 'plan.md') }, toolCallId: '1' }], finishReason: 'tool-calls' };
    const dispatcherDelegateResponse = { text: "Delegating to executor.", toolCalls: [], finishReason: 'stop' };

    mockStreamText
        .mockResolvedValueOnce(dispatcherReadPlanResponse)
        .mockResolvedValueOnce(dispatcherDelegateResponse);

    const executorWriteFileResponse = { text: "Writing file.", toolCalls: [{ toolName: 'file_system.writeFile', args: { path: path.join(projectRoot, 'src/example.js'), content: 'console.log("hello");' }, toolCallId: '2' }], finishReason: 'tool-calls' };
    const executorFinalResponse = { text: "Done.", toolCalls: [], finishReason: 'stop' };

    const mockTriggerAgent = mock(async (agentId, prompt) => {
        if (agentId === '@executor') {
            mockStreamText
                .mockResolvedValueOnce(executorWriteFileResponse)
                .mockResolvedValueOnce(executorFinalResponse);
            return await Engine.prototype.triggerAgent.call(engine, agentId, prompt);
        }
        // For the dispatcher, call the original method directly
        return await Engine.prototype.triggerAgent.call(engine, agentId, prompt);
    });
    engine.triggerAgent = mockTriggerAgent;

    const planContent = `
tasks:
  - id: "1"
    agent: "@executor"
    files_to_create_or_modify: ["src/example.js"]
`;
    await memfs.promises.writeFile(path.join(projectRoot, 'plan.md'), planContent);
    await memfs.promises.mkdir(path.join(projectRoot, 'src'), { recursive: true });

    await engine.triggerAgent('@dispatcher', 'Proceed with the plan.');

    const finalState = await engine.stateManager.getState();
    expect(finalState.project_status).toBe('PLAN_EXECUTED');

    const fileExists = await memfs.promises.exists(path.join(projectRoot, 'src/example.js'));
    expect(fileExists).toBe(true);
  });
});