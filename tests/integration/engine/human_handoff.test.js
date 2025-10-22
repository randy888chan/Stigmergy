import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

let Engine;
let createExecutor;

describe('Human Handoff Workflow', () => {
  let executeTool;
  let mockEngine;
  let broadcastSpy;

  beforeEach(async () => {
    vol.reset();
    mock.module('fs', () => mockFs);
    mock.module('fs-extra', () => mockFs);
    mock.module('../../../services/config_service.js', () => ({
        configService: {
            getConfig: () => ({
                model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                providers: { mock_provider: { api_key: 'mock-key' } }
            }),
        },
    }));

    Engine = (await import('../../../engine/server.js')).Engine;
    createExecutor = (await import('../../../engine/tool_executor.js')).createExecutor;

    process.env.STIGMERGY_CORE_PATH = path.join(process.cwd(), '.stigmergy-core');
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
    const stateManager = new GraphStateManager(process.cwd());
    mockEngine = new Engine({
        broadcastEvent: broadcastSpy,
        projectRoot: process.cwd(),
        corePath: process.env.STIGMERGY_CORE_PATH,
        stateManager,
        startServer: false,
    });

    executeTool = await createExecutor(mockEngine, {}, {}, mockFs);
  });

  afterEach(async () => {
      if (mockEngine) {
          await mockEngine.stop();
      }
      mock.restore();
      delete process.env.STIGMERGY_CORE_PATH;
  });

  test('Dispatcher should be able to call the request_human_approval tool', async () => {
    await executeTool.execute(
      'system.request_human_approval',
      { message: 'Approve plan?', data: { content: 'plan details' } },
      'dispatcher'
    );

    expect(broadcastSpy).toHaveBeenCalledWith(
      'human_approval_request',
      { message: 'Approve plan?', data: { content: 'plan details' } }
    );
  });
});
