import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Engine } from '../../engine/server.js';
import stateManager from '../../src/infrastructure/state/GraphStateManager.js';
import WebSocket from 'ws';
import fs from 'fs-extra';
import path from 'path';

// Give E2E tests a longer timeout
const E2E_TIMEOUT = 60000;

describe('End-to-End Workflow', () => {
  let engine;
  const PORT = 3017; // Use a clean port for E2E tests
  const TEST_PROJECT_DIR = path.join(process.cwd(), 'temp-e2e-project-final');
  const serverUrl = `ws://localhost:${PORT}/ws`;

  beforeAll(async () => {
    console.log('beforeAll: Starting...');
    await fs.ensureDir(path.join(TEST_PROJECT_DIR, 'src'));

    process.env.STIGMERGY_PORT = PORT;
    engine = new Engine(stateManager);
    // In a real test, we might start this in a separate process.
    // For now, starting it directly is fine.
    await engine.start();
    console.log('beforeAll: Done.');
  });

  afterAll(async () => {
    console.log('afterAll: Starting...');
    if (engine && engine.stop) {
      await engine.stop();
    }
    await fs.remove(TEST_PROJECT_DIR);
    console.log('afterAll: Done.');
  });

  test('should create a file with specific content via a full WebSocket workflow', async () => {
    console.log('Starting test...');
    const expectedFileContent = "console.log('Hello, Stigmergy!');";

    // This promise-based wrapper is the key to a robust test.
    // It will not resolve until the entire workflow is complete.
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(serverUrl);

      // CRITICAL: Handle connection errors. This will now fail the test correctly.
      ws.on('error', (err) => {
        console.error('WebSocket error:', err);
        reject(new Error(`WebSocket connection failed: ${err.message}`));
      });

      // Listen for the final confirmation message from the engine
      ws.on('message', async (message) => {
        console.log('WebSocket message received:', message.toString());
        try {
          const data = JSON.parse(message);
          if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
            ws.close();
            resolve(); // The promise is resolved only on full success
          }
        } catch (e) {
          reject(e); // If JSON parsing or assertions fail, reject the promise
        }
      });

      // Once connected, send the initial command
      ws.on('open', () => {
        console.log('WebSocket connection opened.');
        try {
          const prompt = `Create a file named src/output.js that contains a single line: ${expectedFileContent}`;
          ws.send(JSON.stringify({
            type: 'user_chat_message',
            payload: { prompt },
          }));
        } catch (e) {
          reject(e);
        }
      });
    });
  }, E2E_TIMEOUT);
});