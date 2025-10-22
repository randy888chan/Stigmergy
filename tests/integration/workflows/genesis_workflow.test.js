import { test, describe, expect, mock, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
// Do NOT import Engine or createExecutor statically
import { getTestStateManager } from '../../global_state.js';
import { Volume } from 'memfs';
import path from 'path';

// --- Definitive FS Mock ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);
const mockFs = { ...memfs };
mockFs.promises = memfs.promises;
mock.module('fs', () => mockFs);
mock.module('fs-extra', () => mockFs);


// --- Other Mocks ---
const mockCommit = mock(async () => ({ summary: { changes: 1 } }));
const mockInit = mock(async () => {});
const mockSimpleGit = () => ({
    init: mockInit,
    add: mock().mockReturnThis(),
    commit: mockCommit,
});
mock.module('simple-git', () => ({ default: mockSimpleGit }));

const mockStreamText = mock(async () => ({ text: 'Project setup complete.', toolCalls: [], finishReason: 'stop' }));
mock.module('ai', () => ({ streamText: mockStreamText }));

mock.module('../../../services/config_service.js', () => ({
  configService: {
    getConfig: () => ({ model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } } }),
  }
}));

describe('Genesis Agent Workflow', () => {
    let engine;
    let stateManager;
    let Engine; // To be populated by dynamic import
    const projectRoot = '/test-genesis-project';

    beforeAll(() => {
        stateManager = getTestStateManager();
    });

    beforeEach(async () => {
        // DEFINITIVE FIX: Dynamically import modules AFTER mocks are set up.
        Engine = (await import('../../../engine/server.js')).Engine;

        vol.reset();
        await mockFs.promises.mkdir(projectRoot, { recursive: true });
        process.env.STIGMERGY_CORE_PATH = path.join(process.cwd(), '.stigmergy-core-test-genesis');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.promises.mkdir(agentDir, { recursive: true });

        const genesisAgentContent = `
agent:
  id: "@genesis"
  engine_tools: ["shell.*", "git_tool.*", "file_system.*"]
`;
        await mockFs.promises.writeFile(path.join(agentDir, '@genesis.md'), genesisAgentContent);

        engine = new Engine({
            projectRoot,
            stateManager,
            startServer: false,
            _test_streamText: mockStreamText,
            _test_fs: mockFs,
        });

        await engine.stateManager.updateStatus({ newStatus: 'AWAITING_USER_INPUT' });
    });

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
        await mockFs.promises.rm(process.env.STIGMERGY_CORE_PATH, { recursive: true, force: true });
        delete process.env.STIGMERGY_CORE_PATH;
        mock.restore();
        mockInit.mockClear();
        mockCommit.mockClear();
    });

    test('should initialize a new project, create a file, and make an initial commit', async () => {
        const prompt = "Create a new Node.js project with an index.js file that logs 'hello world'";

        const toolCalls = [
            { toolName: 'git_tool.init', args: { path: projectRoot }, toolCallId: '1' },
            { toolName: 'file_system.writeFile', args: { path: path.join(projectRoot, 'index.js'), content: "console.log('hello world');" }, toolCallId: '2' },
            { toolName: 'git_tool.commit', args: { message: 'Initial commit' }, toolCallId: '3' }
        ];

        mockStreamText
            .mockResolvedValueOnce({ text: '', toolCalls, finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ text: 'Commit successful.', toolCalls: [], finishReason: 'stop' });

        await engine.triggerAgent('@genesis', prompt);

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledWith('Initial commit');

        const fileExists = await mockFs.promises.exists(path.join(projectRoot, 'index.js'));
        expect(fileExists).toBe(true);
    });
});