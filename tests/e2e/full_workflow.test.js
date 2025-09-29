import { test, expect, describe, beforeAll, afterAll, mock } from 'bun:test';
import { Engine } from '../../engine/server.js';
import fs from 'fs-extra';
import path from 'path';

const E2E_TIMEOUT = 30000;

describe('End-to-End Workflow with Full Cognitive Loop', () => {
    let engine;
    const PORT = 3017;
    const originalCwd = process.cwd();
    const TEST_PROJECT_DIR = path.join(originalCwd, 'temp-e2e-project-final');
    const serverUrl = `ws://localhost:${PORT}/ws`;

    beforeAll(async () => {
        await fs.ensureDir(TEST_PROJECT_DIR);

        // Set up a self-contained project environment for the test
        const coreSrc = path.join(originalCwd, '.stigmergy-core');
        const coreDest = path.join(TEST_PROJECT_DIR, '.stigmergy-core');
        await fs.copy(coreSrc, coreDest);

        process.chdir(TEST_PROJECT_DIR);

        // This is the "script" for our mock AI's conversation.
        let callCount = 0;
        const mockStreamText = async ({ messages }) => {
            const currentPrompt = messages[messages.length - 1].content;
            callCount++;
            console.log(`[Mock AI] Call #${callCount} | Prompt: "${currentPrompt.substring(0, 80)}..."`);

            // Simulate the multi-agent "Review and Refine" workflow
            if (currentPrompt.includes('create the initial `plan.md`')) {
                // 1. @specifier is triggered, delegates to @qa for review
                return {
                    toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { agent_id: '@qa', prompt: 'Please review this draft plan...' } }],
                    finishReason: 'tool-calls'
                };
            }
            if (currentPrompt.includes('Please review this draft plan')) {
                // 2. @qa is triggered, approves the plan by updating the status
                return {
                    toolCalls: [{ toolCallId: 'c_qa_approve', toolName: 'system.updateStatus', args: { newStatus: 'PLAN_APPROVED' } }],
                    finishReason: 'tool-calls'
                };
            }
            if (currentPrompt.includes('Begin executing the tasks in plan.md')) {
                // 3. @dispatcher is triggered, writes the file
                return {
                    toolCalls: [{ toolCallId: 'c2', toolName: 'file_system.writeFile', args: { path: 'output.js', content: "console.log('Hello, Stigmergy!');" } }],
                    finishReason: 'tool-calls'
                };
            }
            if (messages.some(m => m.role === 'tool' && m.tool_name === 'file_system.writeFile')) {
                // 4. @dispatcher's loop continues, decides the work is done
                return {
                    toolCalls: [{ toolCallId: 'c3', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }],
                    finishReason: 'tool-calls'
                };
            }
            // Fallback for any other call
            return { text: '', finishReason: 'stop' };
        };

        process.env.STIGMERGY_PORT = PORT;
        engine = new Engine({
            projectRoot: TEST_PROJECT_DIR,
            _test_streamText: mockStreamText
        });
        await engine.start();
    });

  afterAll(async () => {
    process.chdir(originalCwd); // Return to original directory
    if (engine && engine.stop) {
      await engine.stop();
    }
    await fs.remove(TEST_PROJECT_DIR);
  });

  test('should execute the full specifier->qa->dispatcher workflow', async () => {
    const expectedFileContent = "console.log('Hello, Stigmergy!');";
    const expectedFilePath = path.join(TEST_PROJECT_DIR, 'output.js');
    let ws;

    try {
      await new Promise((resolve, reject) => {
        ws = new WebSocket(serverUrl);
        ws.onerror = (err) => reject(new Error(`WebSocket connection failed`));
        ws.onmessage = async (event) => {
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
          ws.send(JSON.stringify({
            type: 'user_chat_message',
            payload: { prompt: "Create a simple file." },
          }));
        };
      });
    } finally {
      if (ws) ws.close();
    }

    const fileExists = await fs.pathExists(expectedFilePath);
    expect(fileExists).toBe(true);
    const actualFileContent = await fs.readFile(expectedFilePath, 'utf-8');
    expect(actualFileContent).toBe(expectedFileContent);
  }, E2E_TIMEOUT);
});