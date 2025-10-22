import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

const mockCommit = mock(async () => ({ summary: { changes: 1 } }));
const mockInit = mock(async () => {});
const mockStreamText = mock(async () => ({ text: 'Project setup complete.', toolCalls: [], finishReason: 'stop' }));
let Engine;

describe('Genesis Agent Workflow', () => {
    let engine;
    const projectRoot = '/test-genesis-project';

    beforeEach(async () => {
        vol.reset();
        mockInit.mockClear();
        mockCommit.mockClear();
        mockStreamText.mockClear();

        mock.module('fs', () => mockFs);
        mock.module('fs-extra', () => mockFs);
        const mockSimpleGit = () => ({
            init: mockInit,
            add: mock().mockReturnThis(),
            commit: mockCommit,
        });
        mock.module('simple-git', () => ({ default: mockSimpleGit }));
        mock.module('ai', () => ({ streamText: mockStreamText }));
        mock.module('../../../services/config_service.js', () => ({
            configService: {
                getConfig: () => ({
                    model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                    providers: { mock_provider: { api_key: 'mock-key' } }
                }),
            },
        }));

        Engine = (await import('../../../engine/server.js')).Engine;

        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.ensureDir(agentDir);

        const genesisAgentContent = `
\`\`\`yaml
agent:
  id: "@genesis"
  engine_tools: ["shell.*", "git_tool.*", "file_system.*"]
\`\`\`
`;
        await mockFs.promises.writeFile(path.join(agentDir, '@genesis.md'), genesisAgentContent);

        const stateManager = new GraphStateManager(projectRoot);
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
        mock.restore();
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test('should initialize a new project, create a file, and make an initial commit', async () => {
        const prompt = "Create a new Node.js project with an index.js file that logs 'hello world'";

        const toolCalls = [
            { toolName: 'git_tool.init', args: { path: '.' }, toolCallId: '1' },
            { toolName: 'file_system.writeFile', args: { path: 'index.js', content: "console.log('hello world');" }, toolCallId: '2' },
            { toolName: 'git_tool.commit', args: { message: 'Initial commit' }, toolCallId: '3' }
        ];

        mockStreamText
            .mockResolvedValueOnce({ text: '', toolCalls, finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ text: 'Commit successful.', toolCalls: [], finishReason: 'stop' });

        await engine.triggerAgent('@genesis', prompt);

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledWith(expect.objectContaining({ message: 'Initial commit'}));

        const fileExists = await mockFs.pathExists(path.join(projectRoot, '.stigmergy/sandboxes/genesis/index.js'));
        expect(fileExists).toBe(true);
    });
});
