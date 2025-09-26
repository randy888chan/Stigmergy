import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { Engine } from '../../engine/server.js';
import { WebSocket } from 'ws';

const PORT = 3013; // Use a fresh port

// Mock the initialize method to avoid external dependencies like API key checks
mock.module('../../engine/server.js', async () => {
  const originalModule = await import('../../engine/server.js');
  
  // Create a mock Engine class that extends the original
  class MockEngine extends originalModule.Engine {
    initialize = mock().mockResolvedValue(true);
  }
  
  return {
    ...originalModule,
    Engine: MockEngine
  };
});

describe.skip('Interactive Engine Commands via WebSocket', () => {
  let engine;

  // Use beforeEach and afterEach to ensure a clean engine instance for each test
  beforeEach(async () => {
    engine = new Engine();
    // Assign a unique port for each test run if needed, though beforeEach should handle it
    process.env.PORT = PORT;
    await engine.start();
  });

  afterEach(async () => {
    await engine.stop();
  });

  test('Engine should pause when a "pause" command is received', async () => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);

    // Wait for the connection to open
    await new Promise(resolve => ws.on('open', resolve));

    // Send the pause command
    ws.send(JSON.stringify({ type: 'user_command', payload: 'pause' }));

    // Wait for the confirmation message
    const message = await new Promise(resolve => {
        ws.on('message', (data) => resolve(data));
    });

    const data = JSON.parse(message);
    expect(data.type).toBe('status');
    expect(data.payload.message).toBe('Engine Paused');
    expect(engine.isPaused).toBe(true);

    ws.close();
  }, 10000); // Increase timeout just in case

  test('Engine should resume when a "resume" command is received', async () => {
    // Manually pause the engine first
    engine.pause();
    expect(engine.isPaused).toBe(true);

    const ws = new WebSocket(`ws://localhost:${PORT}`);

    // Wait for the connection to open
    await new Promise(resolve => ws.on('open', resolve));

    // Send the resume command
    ws.send(JSON.stringify({ type: 'user_command', payload: 'resume' }));

    // Wait for the confirmation message
    const message = await new Promise(resolve => {
        ws.on('message', (data) => resolve(data));
    });

    const data = JSON.parse(message);
    expect(data.type).toBe('status');
    expect(data.payload.message).toBe('Engine Resumed');
    expect(engine.isPaused).toBe(false);

    ws.close();
  }, 10000); // Increase timeout just in case
});