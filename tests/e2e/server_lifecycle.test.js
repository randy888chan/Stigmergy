import { test, describe, beforeAll, afterAll } from 'bun:test';
import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';

describe('Server Lifecycle', () => {
  let engine;

  // Store original env vars to restore them later
  const originalEnv = {
    NEO4J_URI: process.env.NEO4J_URI,
    NEO4J_USER: process.env.NEO4J_USER,
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
  };

  beforeAll(async () => {
    // Force memory mode by unsetting Neo4j env vars
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;

    process.env.STIGMERGY_PORT = 3020; // Changed port to avoid conflict
    // This will now initialize safely in memory mode
    const stateManager = new GraphStateManager();
    engine = new Engine({ stateManager });
    await engine.start();
  });

  afterAll(async () => {
    if (engine && engine.stop) {
      await engine.stop();
    }
    // Restore original env vars
    process.env.NEO4J_URI = originalEnv.NEO4J_URI;
    process.env.NEO4J_USER = originalEnv.NEO4J_USER;
    process.env.NEO4J_PASSWORD = originalEnv.NEO4J_PASSWORD;
  });

  test('should start and stop the server', () => {
    // This test is intentionally empty.
    // It's only here to make sure the beforeAll and afterAll hooks run.
  });
});