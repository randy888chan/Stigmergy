import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';
import { Engine } from '../../../engine/server.js';
import { createExecutor as realCreateExecutor } from '../../../engine/tool_executor.js';

// High-fidelity mocks for git operations
const mockCommit = mock(async () => ({ commit: 'mock-commit-hash', summary: { changes: 1 } })); // Accept any args
const mockInit = mock(async () => {});
const mockAdd = mock(async () => {});

const mockStreamText = mock();

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
        // The `cwd` function is also vital, as the tool depends on it.
        const mockSimpleGit = () => {
            const git = {
                init: mockInit,
                add: mockAdd,
                commit: mockCommit,
                cwd: () => git, // Return `this` (git object) for chaining
            };
            return git;
        };
        mock.module('simple-git', () => ({ default: mockSimpleGit, simpleGit: mockSimpleGit }));

        mock.module('ai', () => ({ streamText: mockStreamText }));
        mock.module('../../../services/config_service.js', () => ({
            configService: {
                getConfig: () => ({
                    model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                    providers: { mock_provider: { api_key: 'mock-key' } }
                }),
            },
        }));

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

        const auditorAgentContent = `
\`\`\`yaml
agent:
  id: "@auditor"
  engine_tools: []
\`\`\`
`;
        await mockFs.promises.writeFile(path.join(agentDir, 'auditor.md'), auditorAgentContent);


        const stateManager = new GraphStateManager(projectRoot);
        const mockUnifiedIntelligenceService = {};
        const testExecutorFactory = async (engineInstance, ai, options, fs) => {
            const finalOptions = { ...options, unifiedIntelligenceService: mockUnifiedIntelligenceService };
            return await realCreateExecutor(engineInstance, ai, finalOptions, fs);
        };

        engine = new Engine({
            projectRoot,
            corePath: process.env.STIGMERGY_CORE_PATH,
            stateManager,
            startServer: false,
            _test_streamText: mockStreamText,
            _test_fs: mockFs,
            _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
            _test_executorFactory: testExecutorFactory,
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

        // This simpler, sequential mock is more reliable for this linear workflow.
        mockStreamText
            // 1. Genesis decides to init
            .mockResolvedValueOnce({ text: 'Okay, I will initialize the project.', toolCalls: [toolCalls[0]], finishReason: 'tool-calls' })
            // 2. Genesis decides to write the file
            .mockResolvedValueOnce({ text: 'Now, I will create the file.', toolCalls: [toolCalls[1]], finishReason: 'tool-calls' })
            // 3. The tool executor calls the auditor for the writeFile call
            .mockResolvedValueOnce({ text: '{"compliant": true, "reason": "Constitutional."}', toolCalls: [], finishReason: 'stop' })
            // 4. Genesis decides to commit
            .mockResolvedValueOnce({ text: 'Finally, I will commit the file.', toolCalls: [toolCalls[2]], finishReason: 'tool-calls' })
            // 5. Genesis finishes its work
            .mockResolvedValueOnce({ text: 'All tasks are complete.', toolCalls: [], finishReason: 'stop' });

        await engine.triggerAgent('@genesis', prompt);

        expect(mockInit).toHaveBeenCalledTimes(1);
        expect(mockAdd).toHaveBeenCalledWith('./*');
        expect(mockCommit).toHaveBeenCalledTimes(1);

        // Verify the file was written by trying to read it. This is more robust than pathExists.
        let fileContent;
        try {
            fileContent = await mockFs.promises.readFile(path.join(sandboxDir, 'index.js'), 'utf-8');
        } catch (e) {
            // Let the test fail if the file doesn't exist
        }
        expect(fileContent).toBe("console.log('hello world');");
    });
});
