import { mock, describe, test, expect, beforeEach } from 'bun:test';
import { Engine } from '../../../engine/server.js';
import stateManager from '../../../src/infrastructure/state/GraphStateManager.js';
import fs from 'fs-extra';
import path from 'path';

describe('Human Handoff Workflow', () => {
  let engine;

  beforeEach(() => {
    mock.restore();
    // We must instantiate the engine with the real state manager for this test.
    engine = new Engine(stateManager);
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