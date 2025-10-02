import { test, expect, describe, beforeAll, afterAll, mock } from 'bun:test';
import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';
import fs from 'fs-extra';
import path from 'path';

const E2E_TIMEOUT = 30000;

describe('E2E Workflow (Mock AI)', () => {
    let engine;
    const PORT = 3010;
    const serverUrl = `ws://localhost:${PORT}/ws`;

    beforeAll(async () => {
        // This is the "script" for our mock AI's conversation.
        const mockStreamText = async ({ messages }) => {
            const lastMessage = messages[messages.length - 1];
            const prompt = lastMessage.role === 'user' ? lastMessage.content : `[Received tool result for ${lastMessage.tool_name}]`;

            if (prompt.includes('create the initial `plan.md`')) {
                return { toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review...' } }], finishReason: 'tool-calls' };
            }
            if (prompt.includes('Please review')) {
                // 2. @tools/qa_tools.js is triggered, approves the plan by DELEGATING to the dispatcher.
                return {
                    toolCalls: [{ toolCallId: 'c_qa_approve', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'The plan has been approved. Begin executing the tasks in plan.md.' } }],
                    finishReason: 'tool-calls'
                };
            }
            if (prompt.includes('Begin executing')) {
                return { toolCalls: [{ toolCallId: 'c3', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }], finishReason: 'tool-calls' };
            }
            if (lastMessage.tool_name === 'file_system.writeFile') {
                return { toolCalls: [{ toolCallId: 'c4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' };
            }
            return { text: '', finishReason: 'stop' };
        };

        const stateManager = new GraphStateManager();
        engine = new Engine({ stateManager, _test_streamText: mockStreamText });
        await engine.start();
    });

    afterAll(async () => {
        if (engine) await engine.stop();
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