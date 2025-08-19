import { Engine } from '../../engine/server.js';
import * as stateManager from '../../engine/state_manager.js';
import { jest } from '@jest/globals';

jest.mock('../../engine/state_manager.js');
jest.mock('../../engine/tool_executor.js');

describe('Engine Main Loop Integration Test', () => {
  let engine;

  beforeEach(() => {
    engine = new Engine();
    engine.triggerAgent = jest.fn();
    engine.executeTool = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    engine.stop();
  });

  test('should execute a pending task when in EXECUTION_IN_PROGRESS state', async () => {
    stateManager.getState.mockResolvedValue({ project_status: 'EXECUTION_IN_PROGRESS' });
    engine.triggerAgent.mockResolvedValue({
      action: { tool: 'file_system.writeFile', args: { path: 'test.txt', content: 'hello' } }
    });

    engine.start();
    await jest.advanceTimersByTimeAsync(100); // Allow one loop to run

    expect(stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).toHaveBeenCalledWith('dispatcher', expect.any(Object));
    expect(engine.executeTool).toHaveBeenCalledWith('file_system.writeFile', { path: 'test.txt', content: 'hello' }, 'dispatcher');
  });

  test('should trigger self-improvement cycle after reaching the task threshold', async () => {
    engine.taskCounter = 9; // Set counter to be one less than the cycle
    stateManager.getState.mockResolvedValue({ project_status: 'EXECUTION_IN_PROGRESS' });
    engine.triggerAgent.mockResolvedValue({
      action: { tool: 'some_tool', args: {} }
    });

    engine.start();
    // The first loop runs instantly. We need to advance the timer just enough
    // to trigger the second loop, where the self-improvement check happens.
    await jest.advanceTimersByTimeAsync(100);

    // The primary outcome is that the status is updated
    expect(stateManager.updateStatus).toHaveBeenCalledWith({ newStatus: 'NEEDS_IMPROVEMENT' });
    // After the cycle, the counter should be reset
    expect(engine.taskCounter).toBe(0);
  });
});
