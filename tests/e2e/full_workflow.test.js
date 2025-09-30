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
        // Create the 'src' directory so the file system tool doesn't complain
        await fs.ensureDir(path.join(TEST_PROJECT_DIR, 'src'));

        const coreSrc = path.join(originalCwd, '.stigmergy-core');
        const coreDest = path.join(TEST_PROJECT_DIR, '.stigmergy-core');
        await fs.copy(coreSrc, coreDest);

        process.chdir(TEST_PROJECT_DIR);

        // This is the "script" for our new, smarter mock AI.
        let callCount = 0;
        const mockStreamText = async ({ messages }) => {
            const lastMessage = messages[messages.length - 1];
            callCount++;
            // THIS IS THE CRITICAL FIX: Check the role of the last message.
            const prompt = lastMessage.role === 'user' ? lastMessage.content : `[Received tool result for ${lastMessage.tool_name}]`;
            console.log(`[Mock AI] Call #${callCount} | Prompt: "${prompt.substring(0, 80)}..."`);

            if (prompt.includes('create the initial `plan.md`')) {
                // 1. @specifier is triggered, delegates to @qa for review.
                return {
                    toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review this draft plan...' } }],
                    finishReason: 'tool-calls'
                };
            }
            if (prompt.includes('Please review this draft plan')) {
                // 2. @qa is triggered, approves the plan.
                return {
                    toolCalls: [{ toolCallId: 'c_qa_approve', toolName: 'system.updateStatus', args: { newStatus: 'PLAN_APPROVED' } }],
                    finishReason: 'tool-calls'
                };
            }
            if (prompt.includes('Begin executing the tasks in plan.md')) {
                // 3. @dispatcher is triggered, writes the file.
                return {
                    toolCalls: [{ toolCallId: 'c2', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: "console.log('Hello, Stigmergy!');" } }],
                    finishReason: 'tool-calls'
                };
            }
            // THIS IS THE SECOND CRITICAL FIX: Handle the message after writeFile.
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'file_system.writeFile') {
                // 4. @dispatcher's loop continues, decides the work is done.
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
    process.chdir(originalCwd);
    if (engine && engine.stop) {
      await engine.stop();
    }
    await fs.remove(TEST_PROJECT_DIR);
  });

  test('should execute the full specifier->qa->dispatcher workflow', async () => {
    const expectedFileContent = "console.log('Hello, Stigmergy!');";
    const expectedFilePath = path.join(TEST_PROJECT_DIR, 'src/output.js');
    let ws;

    try {
      await new Promise((resolve, reject) => {
        const testTimeout = setTimeout(() => reject(new Error('Test promise timed out')), 15000);
        ws = new WebSocket(serverUrl);
        ws.onerror = (err) => { clearTimeout(testTimeout); reject(new Error(`WebSocket connection failed`)); };
        ws.onmessage = async (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
              clearTimeout(testTimeout);
              resolve();
            }
          } catch (e) { clearTimeout(testTimeout); reject(e); }
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