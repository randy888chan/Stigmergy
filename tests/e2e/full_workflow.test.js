import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'bun';

const E2E_TIMEOUT = 30000;
const PORT = 3011; // Using a different port to avoid conflicts
const serverUrl = `http://localhost:${PORT}`;
const wsServerUrl = `ws://localhost:${PORT}/ws`;

// Health check function to wait for the server to be ready
async function healthCheck(url, retries = 10, delay = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        console.log('Server is healthy.');
        return;
      }
    } catch (error) {
      // Ignore fetch errors, server might not be up yet
    }
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error('Server did not become healthy in time.');
}


describe('E2E Workflow (Mock AI)', () => {
    let serverProcess;

    beforeAll(async () => {
        console.log('Spawning mock server process...');
        serverProcess = spawn(['bun', 'run', 'tests/e2e/mock_server.js'], {
            stdout: 'pipe',
            stderr: 'pipe',
            env: { ...process.env, STIGMERGY_PORT: String(PORT) },
        });

        // Log server output for debugging
        const streamToString = async (stream) => {
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
                console.log(`[SERVER LOG] ${Buffer.from(chunk).toString()}`);
            }
            return Buffer.concat(chunks).toString();
        }
        streamToString(serverProcess.stdout);
        streamToString(serverProcess.stderr);

        console.log('Waiting for mock server to become healthy...');
        await healthCheck(serverUrl);
    }, E2E_TIMEOUT);

    afterAll(() => {
        console.log('Killing mock server process...');
        if (serverProcess) {
            serverProcess.kill();
        }
    });

    // This test is no longer skipped. It runs the server in a child process
    // to avoid deadlocks with the Bun test runner.
    test('should execute the full specifier->qa->dispatcher workflow', async () => {
        let ws;
        try {
            await new Promise((resolve, reject) => {
                const testTimeout = setTimeout(() => reject(new Error('Test timed out')), 15000);

                ws = new WebSocket(wsServerUrl);

                ws.onerror = (err) => {
                    clearTimeout(testTimeout);
                    reject(err);
                };

                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
                        clearTimeout(testTimeout);
                        resolve();
                    }
                };

                ws.onopen = () => {
                    ws.send(JSON.stringify({ type: 'user_chat_message', payload: { prompt: "Create a simple file." } }));
                };
            });
        } finally {
            if (ws) {
                ws.close();
            }
        }
    });
}, E2E_TIMEOUT);