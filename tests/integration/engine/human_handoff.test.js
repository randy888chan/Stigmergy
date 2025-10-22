import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

const mockStreamText = mock();
let Engine;

describe('Human Handoff Workflow', () => {
  let engine;
  let broadcastSpy;
  let projectRoot;

  beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();

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

    Engine = (await import('../../../engine/server.js')).Engine;

    projectRoot = path.resolve('/test-handoff-project');
    process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
    const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
    await mockFs.ensureDir(agentDir);

    const mockDispatcherAgent = `
\`\`\`yaml
agent:
  id: "dispatcher"
  engine_tools:
    - "system.request_human_approval"
\`\`\`
`;
    await mockFs.promises.writeFile(path.join(agentDir, 'dispatcher.md'), mockDispatcherAgent);

    broadcastSpy = mock(() => {});
    const stateManager = new GraphStateManager(projectRoot);
    engine = new Engine({
        _test_streamText: mockStreamText,
        _test_fs: mockFs,
        broadcastEvent: broadcastSpy,
        projectRoot,
        corePath: process.env.STIGMERGY_CORE_PATH,
        stateManager,
        startServer: false,
    });
  });

  afterEach(async () => {
      if (engine) {
          await engine.stop();
      }
      mock.restore();
      delete process.env.STIGMERGY_CORE_PATH;
  });

  test('Dispatcher agent should call the request_human_approval tool', async () => {
    const toolCall = {
        toolCallId: '1',
        toolName: 'system.request_human_approval',
        args: { message: 'Approve plan?', data: { content: 'plan details' } }
    };

    // This multi-turn mock is crucial for the test to pass.
    mockStreamText
        .mockResolvedValueOnce({ text: 'I need to ask for approval.', toolCalls: [toolCall], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Handoff complete.', finishReason: 'stop' });

    await engine.triggerAgent(
      'dispatcher',
      'Please request approval for the plan.'
    );

    expect(broadcastSpy).toHaveBeenCalledWith(
      'human_approval_request',
      { message: 'Approve plan?', data: { content: 'plan details' } }
    );
  });
});
