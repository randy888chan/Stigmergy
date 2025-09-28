import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { Engine } from '../../engine/server.js';
import fs from 'fs-extra';
import path from 'path';

const E2E_TIMEOUT = 15000;

describe('End-to-End Workflow with Mocked AI', () => {
    let engine;
    const PORT = 3017;
    const TEST_PROJECT_DIR = path.join(process.cwd(), 'temp-e2e-project-final');
    const serverUrl = `ws://localhost:${PORT}/ws`;

    beforeAll(async () => {
        console.log('beforeAll: Starting...');
        await fs.ensureDir(path.join(TEST_PROJECT_DIR, 'src'));

        const planContent = `
# Implementation Plan: E2E Test
- id: "e2e-task-01"
  description: "Create a file at src/output.js with content: console.log('Hello from the dispatcher!');"
  status: "PENDING"
  dependencies: []
  files_to_create_or_modify:
    - "src/output.js"
`;
        await fs.writeFile(path.join(TEST_PROJECT_DIR, 'plan.md'), planContent);

        // This is our stateful mock function that we will inject into the Engine.
        let callCount = 0;
        const mockStreamText = async ({ messages }) => {
            callCount++;
            if (callCount === 1) {
                // First call: Simulate the AI deciding to write the file.
                return {
                    toolCalls: [{ toolCallId: 'c1', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: "console.log('Hello from the dispatcher!');" } }],
                    finishReason: 'tool-calls'
                };
            }
            // Second call: Simulate the AI deciding the work is done.
            return {
                toolCalls: [{ toolCallId: 'c2', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }],
                finishReason: 'tool-calls'
            };
        };

        process.env.STIGMERGY_PORT = PORT;
        // Inject the mock function into the engine. No API key needed.
        engine = new Engine({
            projectRoot: TEST_PROJECT_DIR,
            _test_streamText: mockStreamText
        });
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

  test('should execute a plan from plan.md and create the specified file', async () => {
    console.log('Starting test...');
    const expectedFileContent = "console.log('Hello from the dispatcher!');";
    const expectedFilePath = path.join(TEST_PROJECT_DIR, 'src', 'output.js');
    let ws;

    try {
      await new Promise((resolve, reject) => {
        ws = new WebSocket(serverUrl);

        ws.onerror = (err) => {
          console.error('WebSocket error:', err);
          reject(new Error(`WebSocket connection failed`));
        };

        ws.onmessage = async (event) => {
          console.log('WebSocket message received:', event.data.toString());
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
              resolve();
            }
          } catch (e) {
            reject(e);
          }
        };

        ws.onopen = () => {
          console.log('WebSocket connection opened.');
          try {
            const prompt = `Execute the plan.`;
            ws.send(JSON.stringify({
              type: 'user_chat_message',
              payload: { prompt },
            }));
          } catch (e) {
            reject(e);
          }
        };
      });
    } finally {
      if (ws && ws.readyState !== WebSocket.CLOSED) {
        ws.close();
        console.log('[Test Cleanup] WebSocket connection closed in finally block.');
      }
    }

    // After the workflow is complete, verify the file was created correctly
    const fileExists = await fs.pathExists(expectedFilePath);
    expect(fileExists).toBe(true);
    const actualFileContent = await fs.readFile(expectedFilePath, 'utf-8');
    expect(actualFileContent).toBe(expectedFileContent);
  }, E2E_TIMEOUT);
});