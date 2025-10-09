import { test, expect, describe, beforeEach, afterEach, mock } from 'bun:test';
import path from 'path';
import { Volume } from 'memfs';

// --- MOCKS MUST BE DEFINED BEFORE ANY APPLICATION IMPORTS ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

const mockFsExtra = {
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  existsSync: memfs.existsSync,
  promises: memfs.promises,
  default: null,
};
mockFsExtra.default = mockFsExtra;

// Mock fs-extra and NATIVE fs to ensure all file ops are in-memory
mock.module('fs-extra', () => mockFsExtra);
mock.module('fs', () => memfs);
mock.module('fs/promises', () => memfs.promises);

// --- APPLICATION IMPORTS NOW COME AFTER MOCKS ---
import { Engine } from '../../../engine/server.js';

// Mock the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_status: 'PLAN_APPROVED' }),
    get: mock().mockReturnValue({}),
    on: mock(),
    emit: mock(),
};

describe('Integration: 03 - Execution', () => {
    let engine;
    let projectRoot;

    beforeEach(async () => {
        vol.reset();
        mockStateManagerInstance.updateStatus.mockClear();

        projectRoot = '/test-project-execution';
        const corePath = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(corePath, 'agents');
        process.env.STIGMERGY_CORE_PATH = corePath;

        mockFsExtra.ensureDirSync(agentDir);
        mockFsExtra.ensureDirSync(path.join(projectRoot, 'dashboard', 'public'));
        mockFsExtra.writeFileSync(path.join(projectRoot, 'dashboard', 'public', 'index.html'), '<html></html>');
        mockFsExtra.ensureDirSync('/app/.ai/monitoring');

        const dummyAgentDef = `
\`\`\`yaml
agent:
  id: "dispatcher"
  engine_tools: ["file_system.*", "system.*"]
\`\`\`
`;
        mockFsExtra.writeFileSync(path.join(agentDir, 'dispatcher.md'), dummyAgentDef);

        const mockAI = async ({ messages }) => {
            const lastMessage = messages[messages.length - 1];
            if (lastMessage.role === 'user') {
                return {
                    toolCalls: [{ toolCallId: 'exec-1', toolName: 'file_system.writeFile', args: { path: 'src/final_output.js', content: 'Execution Complete' } }],
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

        engine = new Engine({
            stateManager: mockStateManagerInstance,
            projectRoot: projectRoot,
            corePath: corePath,
            _test_streamText: mockAI,
            _test_fs: mockFsExtra,
            startServer: false,
        });
    });

    afterEach(() => {
        mock.restore();
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test('should execute a plan and create the correct file', async () => {
        await engine.triggerAgent('@dispatcher', 'The plan has been approved. Please proceed.');

        const statusUpdateCall = mockStateManagerInstance.updateStatus.mock.calls.find(call => call[0].newStatus === 'EXECUTION_COMPLETE');
        expect(statusUpdateCall).toBeDefined();

        const outputFile = path.join(projectRoot, '.stigmergy', 'sandboxes', 'dispatcher', 'src', 'final_output.js');
        const fileExists = mockFsExtra.existsSync(outputFile);
        expect(fileExists).toBe(true);

        const content = await mockFsExtra.readFile(outputFile, 'utf-8');
        expect(content).toBe('Execution Complete');
    });
});