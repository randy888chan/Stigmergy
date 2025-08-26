import { Engine } from '../../engine/server.js';
import * as stateManager from '../../engine/state_manager.js';
import { jest } from '@jest/globals';

jest.mock('../../engine/state_manager.js');
jest.mock('../../engine/tool_executor.js');

describe('Engine Main Loop Integration Test', () => {
  let engine;

  beforeEach(() => {
    engine = new Engine();
    // Prevent the real server from starting for these loop-logic tests
    engine.server.listen = jest.fn((port, cb) => {
        if(cb) cb();
        return engine.server;
    });
    engine.triggerAgent = jest.fn();
    engine.executeTool = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    engine.stop();
  });

  test('should execute a pending task when in EXECUTION_IN_PROGRESS state', async () => {
    stateManager.getState.mockResolvedValue({
      status: 'EXECUTION_IN_PROGRESS',
      pending_tasks: [{ tool_name: 'file_system.writeFile', tool_args: { path: 'test.txt', content: 'hello' } }]
    });

    engine.start();
    await jest.advanceTimersByTimeAsync(50); // Allow one loop to run

    expect(stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).toHaveBeenCalledWith('dispatcher', { tool_name: 'file_system.writeFile', tool_args: { path: 'test.txt', content: 'hello' } });
    expect(engine.executeTool).toHaveBeenCalledWith('file_system.writeFile', { path: 'test.txt', content: 'hello' }, 'dispatcher');
  });

  test('should trigger self-improvement cycle after reaching the task threshold', async () => {
    engine.taskCounter = 9; // Set counter to be one less than the cycle
    stateManager.getState.mockResolvedValue({
      status: 'EXECUTION_IN_PROGRESS',
      pending_tasks: [{ tool_name: 'some_tool', tool_args: {} }]
    });

    engine.start();
    await jest.advanceTimersByTimeAsync(50);

    // The primary outcome is that the status is updated
    expect(stateManager.updateStatus).toHaveBeenCalledWith({ newStatus: 'NEEDS_IMPROVEMENT' });
    // After the cycle, the counter should be reset
    expect(engine.taskCounter).toBe(0);
  });
});
