// tests/integration/engine_main_loop.test.js

// Mock dependencies at the top
jest.mock('../../engine/state_manager.js');
jest.mock('../../src/infrastructure/state/GraphStateManager.js');

import { Engine } from '../../engine/server.js';
import * as stateManager from '../../engine/state_manager.js';
import fs from 'fs-extra';
import path from 'path';

describe('Engine Main Loop Integration Test', () => {
  let engine;

  // Use beforeEach to create a fresh engine instance for each test
  beforeEach(async () => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Use fake timers to control time

    // Mock the dispatcher agent file
    const agentDir = path.join(global.StigmergyConfig.core_path, 'agents');
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, 'dispatcher.md'), '```yaml\nagent:\n  id: dispatcher\n  name: Dispatcher\n  model_tier: "b_tier"\n```');

    engine = new Engine();

    // Mock engine methods that interact with external systems
    engine.triggerAgent = jest.fn().mockResolvedValue({
      toolCall: { tool: 'file_system.writeFile', args: { path: 'test.txt', content: 'hello from test' } }
    });
    engine.executeTool = jest.fn();
    engine.getAgent = jest.fn().mockReturnValue({ id: 'dispatcher' });

    // Mock the state manager to return a default state
    engine.stateManager.getState.mockResolvedValue({
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: {
        tasks: [{ id: 'task1', description: 'Write to a file', status: 'PENDING' }]
      }
    });
    engine.stateManager.updateStatus = stateManager.updateStatus;
  });

  // Use afterEach to guarantee cleanup, THIS IS THE CRITICAL FIX
  afterEach(async () => {
    if (engine) {
      await engine.stop(); // This calls clearInterval and cleans up the timer
    }
    jest.useRealTimers(); // Restore real timers
  });

  test('should execute a pending task when in EXECUTION_IN_PROGRESS state', async () => {
    // Act
    await engine.start(); // Start the loop
    await jest.advanceTimersByTimeAsync(5100); // Simulate 5.1 seconds passing

    // Assert
    expect(engine.stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).toHaveBeenCalled();
    expect(engine.executeTool).toHaveBeenCalledWith(
      'file_system.writeFile',
      { path: 'test.txt', content: 'hello from test' },
      'dispatcher'
    );
  });

  test('should do nothing if project status is PAUSED', async () => {
    // Arrange
    engine.stateManager.getState.mockResolvedValue({
      project_status: 'PAUSED',
      project_manifest: { tasks: [] }
    });

    // Act
    await engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    // Assert
    expect(engine.stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).not.toHaveBeenCalled();
  });

  test('should set status to HUMAN_INPUT_NEEDED if dispatcher fails to return a tool call', async () => {
    // Arrange
    engine.triggerAgent.mockResolvedValueOnce({ toolCall: null });

    // Act
    await engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    // Assert
    expect(engine.stateManager.updateStatus).toHaveBeenCalledWith({
        newStatus: 'HUMAN_INPUT_NEEDED',
        message: 'Dispatcher failed to produce a valid tool call.'
    });
  });
});