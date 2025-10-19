import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
import path from "path";
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

mock.module('fs-extra', () => mockFsExtra);
mock.module('fs', () => memfs);
mock.module('fs/promises', () => memfs.promises);

const mockSimpleGit = {
  init: mock().mockResolvedValue(true),
  add: mock().mockResolvedValue(true),
  commit: mock().mockResolvedValue({ commit: 'test-hash', summary: { changes: 1 } }),
};
// We mock the default export of simple-git
mock.module('simple-git', () => ({
  simpleGit: () => mockSimpleGit,
}));

// Mock child_process to simulate shell command side-effects in memory
mock.module('child_process', () => ({
    exec: (command, options, callback) => {
        // The promisified version of exec calls the callback with (error, { stdout, stderr })
        if (command.startsWith('mkdir -p')) {
            // The shell tool executes from within the agent's sandbox directory.
            // The `cwd` option passed to exec will be our sandbox path.
            const dirPath = command.split(' ').pop();
            const fullPath = path.join(options.cwd, dirPath);
            memfs.mkdirSync(fullPath, { recursive: true });
            return callback(null, { stdout: `Created directory: ${fullPath}`, stderr: '' });
        }
        if (command.startsWith('git diff')) {
             return callback(null, { stdout: 'some diff', stderr: '' });
        }
        // For other commands, succeed without any side-effects
        return callback(null, { stdout: '', stderr: '' });
    },
}));


// --- APPLICATION IMPORTS NOW COME AFTER MOCKS ---
import { Engine } from "../../../engine/server.js";

let engine;
let projectRoot;
let originalEnv;

const mockStreamText = mock();

beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    mockSimpleGit.init.mockClear();
    mockSimpleGit.commit.mockClear();

    originalEnv = { ...process.env };
    projectRoot = path.resolve('/test-project');
    const corePath = path.join(projectRoot, '.stigmergy-core');
    process.env.STIGMERGY_CORE_PATH = corePath;
    const agentDir = path.join(corePath, 'agents');
    mockFsExtra.ensureDirSync(agentDir);

    const createAgentFile = (name, tools) => {
        const content = `
\`\`\`yaml
agent:
  id: "${name.toLowerCase()}"
  name: ${name}
  engine_tools: [${tools.join(', ')}]
\`\`\`
`;
        mockFsExtra.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    createAgentFile('Genesis', ['shell.execute', 'git_tool.init', 'file_system.writeFile']);
    createAgentFile('Committer', ['shell.execute', 'git_tool.commit']);

    // Mock state manager to avoid automatic triggers
    const mockStateManagerInstance = {
        initializeProject: mock().mockResolvedValue({}),
        updateStatus: mock().mockResolvedValue({}),
        on: mock(),
        off: mock(),
    };

    engine = new Engine({
        _test_streamText: mockStreamText,
        _test_fs: mockFsExtra,
        stateManager: mockStateManagerInstance,
        projectRoot: projectRoot,
        corePath: corePath,
        startServer: false,
    });
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
    process.env = originalEnv;
});

test('Genesis workflow should create a new project from a prompt', async () => {
    const newProjectDirName = 'my-new-app';
    const newProjectDir = path.join(projectRoot, '.stigmergy', 'sandboxes', 'genesis', newProjectDirName);
    const planFilePath = path.join(projectRoot, '.stigmergy', 'sandboxes', 'genesis', 'plan.md');

    // 1. Mock AI for Genesis to create project structure
    mockStreamText
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'shell.execute', args: { command: `mkdir -p ${newProjectDirName}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'git_tool.init', args: { path: newProjectDirName } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: 'plan.md', content: '- [X] All tasks complete.' } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Project structure created.', finishReason: 'stop' });

    await engine.triggerAgent('@genesis', `Create a new node.js project named ${newProjectDirName}`);

    // Verify Genesis agent's actions by checking their side-effects
    expect(mockFsExtra.existsSync(newProjectDir)).toBe(true);
    expect(mockSimpleGit.init).toHaveBeenCalled();
    expect(mockFsExtra.existsSync(planFilePath)).toBe(true);

    // 2. Mock AI for Committer to commit the changes
    const commitMessage = 'feat: initial commit';
    mockStreamText
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '4', toolName: 'shell.execute', args: { command: 'git diff --staged' } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '5', toolName: 'git_tool.commit', args: { message: commitMessage } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Commit created.', finishReason: 'stop' });

    await engine.triggerAgent('@committer', 'The work is complete. Please commit the changes.');

    // Verify Committer agent's actions by checking the mock
    expect(mockSimpleGit.commit).toHaveBeenCalledWith(commitMessage);
});