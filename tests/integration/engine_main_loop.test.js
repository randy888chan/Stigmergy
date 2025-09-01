import { Engine } from '../../engine/server.js';
import * as stateManager from '../../engine/state_manager.js';
import { jest } from '@jest/globals';

jest.mock('../../engine/state_manager.js');

import fs from 'fs-extra';
import path from 'path';

describe('Engine Main Loop Integration Test', () => {
  let engine;
  let getStateSpy, updateStatusSpy;

  beforeAll(() => {
    const agentDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    fs.ensureDirSync(agentDir);
    fs.writeFileSync(path.join(agentDir, 'dispatcher.md'), '```yaml\nagent:\n  id: dispatcher\n  name: Dispatcher\n  persona: { role: "Test" }\n  core_protocols: []\n```');
  });

  afterAll(() => {
    const coreDir = path.join(process.cwd(), '.stigmergy-core');
    if (fs.existsSync(coreDir)) {
      fs.removeSync(coreDir);
    }
  });

  beforeEach(() => {
    engine = new Engine();
    engine.server.listen = jest.fn((port, cb) => {
        if(cb) cb();
        return engine.server;
    });
    engine.triggerAgent = jest.fn().mockResolvedValue({
      toolCall: { tool: 'file_system.writeFile', args: { path: 'test.txt', content: 'hello from test' } }
    });
    engine.executeTool = jest.fn();
    
    // Set up spies on the actual imported module's functions
    getStateSpy = jest.spyOn(stateManager, 'getState');
    updateStatusSpy = jest.spyOn(stateManager, 'updateStatus');

    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    engine.stop();
    jest.clearAllMocks();
  });

  test('should execute a pending task when in EXECUTION_IN_PROGRESS state', async () => {
    getStateSpy.mockResolvedValue({
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: {
        tasks: [{ description: 'Write to a file', status: 'PENDING' }]
      }
    });

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'dispatcher' }),
      expect.stringContaining('Project Status: EXECUTION_IN_PROGRESS')
    );
    expect(engine.executeTool).toHaveBeenCalledWith(
      'file_system.writeFile',
      { path: 'test.txt', content: 'hello from test' },
      'dispatcher'
    );
  });

  test('should do nothing if project status is PAUSED', async () => {
    getStateSpy.mockResolvedValue({
      project_status: 'PAUSED',
      project_manifest: { tasks: [] }
    });

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).not.toHaveBeenCalled();
  });
  
  test('should set status to HUMAN_INPUT_NEEDED if dispatcher fails to return a tool call', async () => {
    getStateSpy.mockResolvedValue({
        project_status: 'EXECUTION_IN_PROGRESS',
        project_manifest: { tasks: [{ description: 'A task', status: 'PENDING' }] }
    });
    engine.triggerAgent.mockResolvedValue({ toolCall: null });

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(updateStatusSpy).toHaveBeenCalledWith({
        newStatus: 'HUMAN_INPUT_NEEDED',
        message: 'Dispatcher failed to produce a valid tool call.'
    });
  });
});
