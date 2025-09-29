import { mock, describe, test, expect, beforeEach } from 'bun:test';
import { Engine } from '../../../engine/server.js';
import fs from 'fs-extra';
import path from 'path';

// Create a mock instance that our test can control
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    on: mock(),
    emit: mock(),
};

describe('Human Handoff Workflow', () => {
  let engine;

  beforeEach(() => {
    mock.restore();
    // Inject the mock StateManager when creating the engine
    engine = new Engine({
        stateManager: mockStateManagerInstance // Pass the mock instance directly
    });
  });

  test('Dispatcher should be able to call the request_human_approval tool', async () => {
    // Spy on the engine's broadcastEvent method. This is our verification point.
    const broadcastSpy = mock(engine.broadcastEvent);
    engine.broadcastEvent = broadcastSpy;

    // Simulate a tool call from the @dispatcher agent.
    // We are calling the tool executor directly to isolate the test.
    await engine.executeTool.execute(
      'system.request_human_approval',
      { message: 'Approve plan?', data: { content: 'plan details' } },
      'dispatcher'
    );

    // Assert that the broadcast event was called with the correct payload.
    expect(broadcastSpy).toHaveBeenCalledWith(
      'human_approval_request',
      { message: 'Approve plan?', data: { content: 'plan details' } }
    );
  });
});