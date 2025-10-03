import { test, expect, describe, beforeAll, afterAll } from 'bun:test';
import { spawn } from 'bun';
import path from 'path';
import fs from 'fs-extra';
import WebSocket from 'ws';

const E2E_TIMEOUT = 30000;
const PORT = 3019; // Use a different port to avoid conflicts
const serverUrl = `ws://localhost:${PORT}/ws`;
const healthCheckUrl = `http://localhost:${PORT}/`;
const originalCwd = process.cwd();
const TEST_PROJECT_DIR = path.join(originalCwd, 'temp-e2e-workflow-final');

// Helper function to wait for the server to be ready
const waitForServer = async () => {
    const maxRetries = 20;
    const retryDelay = 500;
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(healthCheckUrl);
            if (response.ok) {
                console.log("E2E Test Server is ready.");
                return;
            }
        } catch (e) {
            // Ignore connection errors and retry
        }
        await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
    throw new Error("E2E Test Server failed to start in time.");
};

describe('E2E Workflow (Out-of-Process)', () => {
    let serverProcess;

    // Store original env vars to restore them later, ensuring test isolation
    const originalEnv = {
        NEO4J_URI: process.env.NEO4J_URI,
        NEO4J_USER: process.env.NEO4J_USER,
        NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    };

    beforeAll(async () => {
        // --- 1. Setup the test environment ---
        await fs.ensureDir(path.join(TEST_PROJECT_DIR, 'src'));
        // We will run the server with TEST_PROJECT_DIR as its cwd

        // --- 2. Force memory mode by unsetting Neo4j env vars ---
        const env = {
            ...process.env,
            STIGMERGY_PORT: String(PORT),
            NEO4J_URI: undefined,
            NEO4J_USER: undefined,
            NEO4J_PASSWORD: undefined,
            E2E_PROJECT_ROOT: originalCwd, // Pass the actual project root to the server process
            STIGMERGY_CORE_PATH: path.join(originalCwd, '.stigmergy-core'), // Explicitly set core path
        };

        // --- 3. Spawn the server as a child process ---
        serverProcess = spawn(
            ['bun', 'run', path.join(originalCwd, 'tests/e2e/test_server_entrypoint.js')],
            {
                cwd: TEST_PROJECT_DIR, // Run the server in the temp directory
                env,
                stdio: ['ignore', 'pipe', 'pipe'], // Capture stdout/stderr
            }
        );

        // Optional: Log server output for debugging
        const logStream = async (stream, prefix) => {
            const reader = stream.getReader();
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                console.log(`${prefix} ${new TextDecoder().decode(value).trim()}`);
            }
        };

        logStream(serverProcess.stdout, '[Test Server]');
        logStream(serverProcess.stderr, '[Test Server ERR]');

        // --- 4. Wait for the server to be healthy ---
        await waitForServer();
    }, E2E_TIMEOUT);

    afterAll(async () => {
        // --- 5. Clean up ---
        if (serverProcess) {
            serverProcess.kill(); // Terminate the child process
        }
        await fs.remove(TEST_PROJECT_DIR);

        // --- Restore original env vars for other tests ---
        process.env.NEO4J_URI = originalEnv.NEO4J_URI;
        process.env.NEO4J_USER = originalEnv.NEO4J_USER;
        process.env.NEO4J_PASSWORD = originalEnv.NEO4J_PASSWORD;
    });

    test('should execute the full specifier->qa->dispatcher workflow and write a file', async () => {
        let ws;
        let finalStateReceived = false;
        try {
            await new Promise((resolve, reject) => {
                // Set a timeout for the entire test promise
                const testTimeout = setTimeout(() => {
                    reject(new Error('Test timed out waiting for EXECUTION_COMPLETE state.'));
                }, 15000); // 15-second timeout for this specific async operation

                ws = new WebSocket(serverUrl);

                ws.on('error', (err) => {
                    clearTimeout(testTimeout);
                    reject(err);
                });

                ws.on('message', (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        // Check for the final state that indicates success
                        if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
                            finalStateReceived = true;
                            clearTimeout(testTimeout);
                            resolve();
                        }
                    } catch (e) {
                        // Ignore non-JSON messages
                    }
                });

                ws.on('open', () => {
                    // Send the initial prompt to kick off the workflow
                    ws.send(JSON.stringify({
                        type: 'user_chat_message',
                        payload: { prompt: "Create a simple file." }
                    }));
                });

                ws.on('close', () => {
                    if (!finalStateReceived) {
                        clearTimeout(testTimeout);
                        reject(new Error('WebSocket closed before the test completed.'));
                    }
                });
            });

            // After the workflow completes, verify the file was actually created
            const outputFile = path.join(TEST_PROJECT_DIR, '.stigmergy-core', 'sandboxes', 'dispatcher', 'src', 'output.js');
            const fileExists = await fs.pathExists(outputFile);
            expect(fileExists).toBe(true);

            const content = await fs.readFile(outputFile, 'utf-8');
            expect(content).toBe('Hello World');

        } finally {
            // Ensure the WebSocket is always closed
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        }
    }, E2E_TIMEOUT);
});