/**
 * @jest-environment node
 */
import { Engine } from '../../engine/server.js';
import { WebSocket } from 'ws';
import fs from 'fs-extra';
import path from 'path';
import { jest } from '@jest/globals';

// Give E2E tests a longer timeout
jest.setTimeout(60000);

describe.skip('E2E: Full User Workflow', () => {
  let engine;
  const PORT = 3015; // Use a clean port for E2E tests
  const TEST_PROJECT_DIR = path.join(process.cwd(), 'temp-e2e-project');
  const originalCwd = process.cwd();

  beforeAll(async () => {
    // Set up a temporary, isolated project directory for the test
    await fs.ensureDir(TEST_PROJECT_DIR);

    // Copy the agent definitions and config to the temp directory to simulate a real project
    const coreSrc = path.join(originalCwd, '.stigmergy-core');
    const coreDest = path.join(TEST_PROJECT_DIR, '.stigmergy-core');
    await fs.copy(coreSrc, coreDest);

    const configSrc = path.join(originalCwd, 'stigmergy.config.js');
    const configDest = path.join(TEST_PROJECT_DIR, 'stigmergy.config.js');
    await fs.copy(configSrc, configDest);

    // Create a dummy .env file to satisfy the engine's initialization checks
    await fs.writeFile(path.join(TEST_PROJECT_DIR, '.env'), 'OPENROUTER_API_KEY=dummy-key-for-testing');

    process.chdir(TEST_PROJECT_DIR); // Change CWD to the temp directory

    process.env.STIGMERGY_PORT = PORT;
    engine = new Engine();
    await engine.initialize();
    await engine.start();
  });

  afterAll(async () => {
    if (engine) {
      await engine.stop();
    }
    process.chdir(originalCwd); // Change CWD back
    await fs.remove(TEST_PROJECT_DIR); // Clean up the temp directory
  });

  test('should create a functional file from a natural language prompt', (done) => {
    const ws = new WebSocket(`ws://localhost:${PORT}`);
    const expectedFilePath = path.join(TEST_PROJECT_DIR, 'hello.js');

    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      // The final confirmation is when the project status is 'EXECUTION_COMPLETE'
      if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
        // Now, perform the ULTIMATE validation: check the file system.
        const fileExists = await fs.pathExists(expectedFilePath);
        expect(fileExists).toBe(true);

        const fileContent = await fs.readFile(expectedFilePath, 'utf8');
        expect(fileContent).toContain('function helloWorld()');
        expect(fileContent).toContain("return 'Hello, World!';");

        ws.close();
        done();
      }
    });

    ws.on('open', () => {
      const prompt = "Create a file named hello.js that exports a single function called helloWorld which returns the string 'Hello, World!'";
      ws.send(JSON.stringify({
        type: 'user_chat_message',
        payload: { prompt },
      }));
    });
  });
});
