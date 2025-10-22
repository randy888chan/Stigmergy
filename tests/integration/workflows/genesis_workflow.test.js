import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

// High-fidelity mocks for git operations
const mockCommit = mock(async (message) => ({ commit: 'mock-commit-hash', summary: { changes: 1 } }));
const mockInit = mock(async () => {});
const mockAdd = mock().mockReturnThis(); // For chaining: git.add().commit()

const mockStreamText = mock();
let Engine;

describe('Genesis Agent Workflow', () => {
    let engine;
    let projectRoot;

    beforeEach(async () => {
        vol.reset();
        mockInit.mockClear();
        mockCommit.mockClear();
        mockStreamText.mockClear();
        mockAdd.mockClear();

        mock.module('fs', () => mockFs);
        mock.module('fs-extra', () => mockFs);

        // This mock is critical. `simple-git` checks for directory existence, which fails in memfs.
        const mockSimpleGit = () => ({
            init: mockInit,
            add: mockAdd,
            commit: mockCommit,
        });
        mock.module('simple-git', () => ({ simpleGit: mockSimpleGit }));

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

        projectRoot = path.resolve('/test-genesis-project');
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
        await mockFs.promises.writeFile(path.join(agentDir, 'genesis.md'), genesisAgentContent);

        const stateManager = new GraphStateManager(projectRoot);
        engine = new Engine({
            projectRoot,
            corePath: process.env.STIGMERGY_CORE_PATH,
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

        const sandboxDir = path.join(projectRoot, '.stigmergy/sandboxes/genesis');
        await mockFs.ensureDir(sandboxDir);

        // Realistic multi-turn mock
        const toolCalls = [
            { toolName: 'git_tool.init', args: { path: '.' }, toolCallId: '1' },
            { toolName: 'file_system.writeFile', args: { path: 'index.js', content: "console.log('hello world');" }, toolCallId: '2' },
            { toolName: 'git_tool.commit', args: { message: 'Initial commit' }, toolCallId: '3' }
        ];

        mockStreamText
            .mockResolvedValueOnce({ text: 'Okay, I will initialize the project, create the file, and commit.', toolCalls, finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ text: 'All tasks are complete.', toolCalls: [], finishReason: 'stop' });

        await engine.triggerAgent('@genesis', prompt);

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockAdd).toHaveBeenCalledWith('./*');
        expect(mockCommit).toHaveBeenCalledTimes(1);
        expect(mockCommit).toHaveBeenCalledWith('Initial commit');

        // Verify the file was written inside the agent's sandbox
        const fileExists = await mockFs.pathExists(path.join(sandboxDir, 'index.js'));
        expect(fileExists).toBe(true);
    });
});
