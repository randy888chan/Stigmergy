import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import { Engine } from '../../../engine/server.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';
import path from 'path';
import { Volume } from 'memfs';
import { createFsFromVolume } from 'memfs';

describe('Integration: 03 - Execution (Dependency Injection)', () => {
    let engine;
    let mockStateManager;
    let memfs;

    beforeEach(async () => {
        // 1. Set up an in-memory filesystem
        const vol = new Volume();
        memfs = createFsFromVolume(vol);
        const projectRoot = '/app';
        const corePath = path.join(projectRoot, '.stigmergy-core');
        const sandboxPath = path.join(corePath, 'sandboxes', 'dispatcher');

        // Create necessary directories in the virtual FS
        const agentDir = path.join(corePath, 'agents');
        memfs.mkdirSync(agentDir, { recursive: true });
        memfs.mkdirSync(path.join(sandboxPath, 'src'), { recursive: true });

        // Create dummy agent and plan files that the engine will "read"
        const dummyAgentDef = `
\`\`\`yaml
agent:
  id: "dispatcher"
  engine_tools:
    - "file_system.*"
    - "system.*"
\`\`\`
`;
        memfs.writeFileSync(path.join(agentDir, 'dispatcher.md'), dummyAgentDef);
        memfs.writeFileSync(path.join(projectRoot, 'plan.md'), '1. Create the output file.');

        // 2. Mock the GraphStateManager to start in the correct state
        mockStateManager = new GraphStateManager();
        mockStateManager.getState = mock(() => Promise.resolve({ project_status: 'PLAN_APPROVED' }));
        mockStateManager.updateStatus = mock(() => Promise.resolve());

        // 3. Mock the AI to guide the dispatcher
        const mockAI = async ({ messages }) => {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                return {
                    toolCalls: [{ toolCallId: 'exec-1', toolName: 'file_system.writeFile', args: { path: 'src/final_output.js', content: 'DI Execution Complete' } }],
                    finishReason: 'tool-calls', text: ''
                };
            }
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'file_system.writeFile') {
                return {
                    toolCalls: [{ toolCallId: 'exec-2', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }],
                    finishReason: 'tool-calls', text: ''
                };
            }
            return { finishReason: 'stop', text: 'Execution finished.' };
        };

        // 4. Create a complete fs-extra mock that operates on our in-memory volume
        const fsExtraMock = {
            ...memfs.promises,
            ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
        };

        // 5. Instantiate the Engine, injecting the fs-extra mock
        engine = new Engine({
            stateManager: mockStateManager,
            projectRoot: projectRoot,
            corePath: corePath,
            _test_streamText: mockAI,
            _test_fs: fsExtraMock, // This is the dependency injection
        });
    });

    test('should execute a plan and create the correct file using injected fs', async () => {
        // Directly trigger the dispatcher agent
        await engine.triggerAgent('@dispatcher', 'The plan has been approved. Please proceed.');

        // Verify the final status was set to EXECUTION_COMPLETE
        const lastStatusUpdate = mockStateManager.updateStatus.mock.calls[0][0];
        expect(lastStatusUpdate.newStatus).toBe('EXECUTION_COMPLETE');

        // Verify that the file was created correctly in the agent's sandboxed directory
        const outputFile = '/app/.stigmergy/sandboxes/dispatcher/src/final_output.js';
        const fileExists = memfs.existsSync(outputFile);
        expect(fileExists).toBe(true);

        const content = memfs.readFileSync(outputFile, 'utf-8');
        expect(content).toBe('DI Execution Complete');
    });
});