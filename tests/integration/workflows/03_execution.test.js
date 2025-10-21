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
};

// Mock fs-extra and NATIVE fs to ensure all file ops are in-memory
// The `{ default: mock, ...mock }` structure handles both default and named imports.
mock.module('fs-extra', () => ({ default: mockFsExtra, ...mockFsExtra }));
mock.module('fs', () => ({ default: memfs, ...memfs }));
mock.module('fs/promises', () => ({ default: memfs.promises, ...memfs.promises }));

// Mock the config service to prevent it from requiring API keys in a test
mock.module('../../../services/config_service.js', () => ({
    configService: {
        getConfig: () => ({
            // Provide a minimal valid config for the test
            ai_providers: {
                google: null,
                openrouter: { api_key: 'mock-key-is-set' } // Satisfy the validator
            },
            tiers: {
                reasoning_tier: { provider: 'openrouter', model: 'mock-model' }
            }
        })
    }
}));


// Mock the entire service that's causing the nested import issue
mock.module('../../../services/unified_intelligence.js', () => ({
    unifiedIntelligenceService: {
        initialize: mock().mockResolvedValue(undefined),
        scanCodebase: mock().mockResolvedValue({}),
        // Add other methods used by the application if any
    }
}));

// --- APPLICATION IMPORTS NOW COME AFTER MOCKS ---
// We will import Engine dynamically inside beforeEach after mocks are set up.

// Mock the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_status: 'PLAN_APPROVED' }),
    get: mock().mockReturnValue({}),
    on: mock(),
    off: mock(),
    emit: mock(),
    closeDriver: mock(),
};

describe('Integration: 03 - Execution', () => {
    let engine;
    let projectRoot;
    let Engine; // To store the dynamically imported class

    beforeEach(async () => {
        vol.reset();
        mockStateManagerInstance.updateStatus.mockClear();

        // Dynamically import Engine after all mocks are set up
        Engine = (await import('../../../engine/server.js')).Engine;

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

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
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