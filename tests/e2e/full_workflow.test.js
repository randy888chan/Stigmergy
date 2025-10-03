import { test, expect, describe, beforeAll, afterAll, mock } from 'bun:test';
import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';
import fs from 'fs-extra';
import path from 'path';
import WebSocket from 'ws';

const E2E_TIMEOUT = 30000;

describe('E2E Workflow (Mock AI, In-Process)', () => {
    let engine;
    let stateManager;
    const PORT = 3017;
    const serverUrl = `ws://localhost:${PORT}/ws`;
    const originalCwd = process.cwd();
    const TEST_PROJECT_DIR = path.join(originalCwd, 'temp-e2e-workflow-final');

    // Store original env vars to restore them later, ensuring test isolation
    const originalEnv = {
        NEO4J_URI: process.env.NEO4J_URI,
        NEO4J_USER: process.env.NEO4J_USER,
        NEO4J_PASSWORD: process.env.NEO4J_PASSWORD,
    };

    beforeAll(async () => {
        // --- 0. Force memory mode by unsetting Neo4j env vars ---
        // This is the key change to prevent hangs and failures.
        delete process.env.NEO4J_URI;
        delete process.env.NEO4J_USER;
        delete process.env.NEO4J_PASSWORD;

        // --- 1. Setup the test environment ---
        await fs.ensureDir(path.join(TEST_PROJECT_DIR, 'src'));
        process.chdir(TEST_PROJECT_DIR);

        // --- 2. Initialize StateManager ---
        // Now that env vars are unset, this will safely initialize in memory mode.
        stateManager = new GraphStateManager(TEST_PROJECT_DIR);

        // --- 3. Define the Mock AI's script ---
        const mockStreamText = async ({ messages }) => {
            const lastMessage = messages[messages.length - 1];
            const prompt = lastMessage.role === 'user' ? lastMessage.content : `[Received tool result for ${lastMessage.tool_name}]`;

            if (prompt.includes('create the initial `plan.md`')) {
                return { toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review...' } }], finishReason: 'tool-calls' };
            }
            if (prompt.includes('Please review')) {
                return { toolCalls: [{ toolCallId: 'c2', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'Plan approved. Execute.' } }], finishReason: 'tool-calls' };
            }
            if (prompt.includes('Execute')) {
                return { toolCalls: [{ toolCallId: 'c3', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }], finishReason: 'tool-calls' };
            }
            if (lastMessage.tool_name === 'file_system.writeFile') {
                return { toolCalls: [{ toolCallId: 'c4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' };
            }
            return { text: '', finishReason: 'stop' };
        };

        // --- 4. Start the Engine in the same process ---
        process.env.STIGMERGY_PORT = PORT;
        engine = new Engine({ stateManager, _test_streamText: mockStreamText });
        await engine.start();
    });

    afterAll(async () => {
        if (engine) await engine.stop();
        process.chdir(originalCwd);
        await fs.remove(TEST_PROJECT_DIR);

        // --- Restore original env vars for other tests ---
        process.env.NEO4J_URI = originalEnv.NEO4J_URI;
        process.env.NEO4J_USER = originalEnv.NEO4J_USER;
        process.env.NEO4J_PASSWORD = originalEnv.NEO4J_PASSWORD;
    });

    test('should execute the full specifier->qa->dispatcher workflow', async () => {
        let ws;
        try {
            await new Promise((resolve, reject) => {
                const testTimeout = setTimeout(() => reject(new Error('Test timed out')), 15000);
                ws = new WebSocket(serverUrl);
                ws.onerror = (err) => { clearTimeout(testTimeout); reject(err); };
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'state_update' && data.payload.project_status === 'EXECUTION_COMPLETE') {
                        clearTimeout(testTimeout);
                        resolve();
                    }
                };
                ws.onopen = () => ws.send(JSON.stringify({ type: 'user_chat_message', payload: { prompt: "Create a simple file." } }));
            });
        } finally {
            if (ws) ws.close();
        }
    });
}, E2E_TIMEOUT);