import { test, describe, beforeAll, afterAll } from 'bun:test';
import { Engine } from '../../engine/server.js';

describe('Server Lifecycle', () => {
  let engine;

  beforeAll(async () => {
    process.env.STIGMERGY_PORT = 3018;
    engine = new Engine();
    await engine.start();
  });

  afterAll(async () => {
    if (engine && engine.stop) {
      await engine.stop();
    }
  });

  test('should start and stop the server', () => {
    // This test is intentionally empty.
    // It's only here to make sure the beforeAll and afterAll hooks run.
  });
});