// Mock the state_manager module before any imports
jest.mock('../../engine/state_manager.js', () => ({
  getState: jest.fn(),
  updateStatus: jest.fn(),
  updateState: jest.fn(),
  initializeProject: jest.fn(),
  transitionToState: jest.fn(),
  updateTaskStatus: jest.fn()
}));

// Mock the GraphStateManager
jest.mock('../../src/infrastructure/state/GraphStateManager.js', () => {
  return {
    __esModule: true,
    default: {
      getState: jest.fn(),
      updateState: jest.fn(),
      testConnection: jest.fn().mockResolvedValue({ status: 'ok', message: 'Neo4j connection successful' }),
      on: jest.fn(),
      emit: jest.fn()
    }
  };
});

import { Engine } from '../../engine/server.js';
import * as stateManager from '../../engine/state_manager.js';
import fs from 'fs-extra';
import path from 'path';

describe('Engine Main Loop Integration Test', () => {
  let engine;


  beforeEach(async () => {
    // Create a mock dispatcher agent in the temporary test directory
    const agentDir = path.join(global.StigmergyConfig.core_path, 'agents');
    await fs.ensureDir(agentDir);
    await fs.writeFile(path.join(agentDir, 'dispatcher.md'), '```yaml\nagent:\n  id: dispatcher\n  name: Dispatcher\n  persona: { role: "Test" }\n  core_protocols: []\n  model_tier: "b_tier"\n```');

    // Reset all mocks
    jest.clearAllMocks();
    
    engine = new Engine();
    engine.server.listen = jest.fn((port, cb) => {
        if(cb) cb();
        return engine.server;
    });
    engine.triggerAgent = jest.fn().mockResolvedValue({
      toolCall: { tool: 'file_system.writeFile', args: { path: 'test.txt', content: 'hello from test' } }
    });
    engine.executeTool = jest.fn();
    // Mock the getAgent method to return a proper agent object
    engine.getAgent = jest.fn().mockReturnValue({
      id: 'dispatcher',
      systemPrompt: 'Test system prompt',
      modelTier: 'b_tier'
    });
    
    // Set up mocks for the state manager functions
    stateManager.getState.mockResolvedValue({
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: {
        tasks: [{ description: 'Write to a file', status: 'PENDING' }]
      }
    });
    stateManager.updateStatus.mockResolvedValue();
    
    // Mock the GraphStateManager
    engine.stateManager.getState.mockResolvedValue({
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: {
        tasks: [{ description: 'Write to a file', status: 'PENDING' }]
      }
    });

    jest.useFakeTimers();
  });

  afterEach(async () => {
    // Clean up the mock agent file
    const agentDir = path.join(global.StigmergyConfig.core_path, 'agents');
    await fs.remove(agentDir);

    jest.useRealTimers();
    if (engine) {
      engine.stop();
    }
    jest.clearAllMocks();
  });

  test('should execute a pending task when in EXECUTION_IN_PROGRESS state', async () => {
    // Set up the specific mock for this test
    const state = {
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: {
        tasks: [{ description: 'Write to a file', status: 'PENDING' }]
      }
    };
    
    stateManager.getState.mockResolvedValueOnce(state);
    engine.stateManager.getState.mockResolvedValueOnce(state);

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(engine.stateManager.getState).toHaveBeenCalled();
    expect(engine.getAgent).toHaveBeenCalledWith('dispatcher');
    expect(engine.triggerAgent).toHaveBeenCalled();
    expect(engine.executeTool).toHaveBeenCalledWith(
      'file_system.writeFile',
      { path: 'test.txt', content: 'hello from test' },
      'dispatcher'
    );
  });

  test('should do nothing if project status is PAUSED', async () => {
    // Set up the specific mock for this test
    const state = {
      project_status: 'PAUSED',
      project_manifest: { tasks: [] }
    };
    
    stateManager.getState.mockResolvedValueOnce(state);
    engine.stateManager.getState.mockResolvedValueOnce(state);

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(engine.stateManager.getState).toHaveBeenCalled();
    expect(engine.triggerAgent).not.toHaveBeenCalled();
  });
  
  test('should set status to HUMAN_INPUT_NEEDED if dispatcher fails to return a tool call', async () => {
    // Set up the specific mocks for this test
    const state = {
      project_status: 'EXECUTION_IN_PROGRESS',
      project_manifest: { tasks: [{ description: 'A task', status: 'PENDING' }] }
    };
    
    stateManager.getState.mockResolvedValueOnce(state);
    engine.stateManager.getState.mockResolvedValueOnce(state);
    engine.triggerAgent.mockResolvedValueOnce({ toolCall: null });

    engine.start();
    await jest.advanceTimersByTimeAsync(5100);

    expect(engine.stateManager.getState).toHaveBeenCalled();
    expect(stateManager.updateStatus).toHaveBeenCalledWith({
        newStatus: 'HUMAN_INPUT_NEEDED',
        message: 'Dispatcher failed to produce a valid tool call.'
    });
  });
});