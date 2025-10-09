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

// Mock fs-extra and NATIVE fs to ensure all file ops are in-memory
mock.module('fs-extra', () => mockFsExtra);
mock.module('fs', () => memfs);
mock.module('fs/promises', () => memfs.promises);

// --- APPLICATION IMPORTS NOW COME AFTER MOCKS ---
import { Engine as Stigmergy } from "../../../engine/server.js";

// Mock the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    get: mock().mockReturnValue({}),
    on: mock(),
    emit: mock(),
};

const mockStreamText = mock();

let engine;
let projectRoot;
let writeFileSpy;


beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    mockStateManagerInstance.updateStatus.mockClear();

    projectRoot = path.resolve('/test-project');
    const corePath = path.join(projectRoot, '.stigmergy-core');
    process.env.STIGMERGY_CORE_PATH = corePath;
    const agentDir = path.join(corePath, 'agents');
    mockFsExtra.ensureDirSync(agentDir);
    mockFsExtra.ensureDirSync(path.join(projectRoot, 'dashboard', 'public'));
    mockFsExtra.writeFileSync(path.join(projectRoot, 'dashboard', 'public', 'index.html'), '<html></html>');
    mockFsExtra.ensureDirSync('/app/.ai/monitoring');

    const createAgentFile = (name) => {
        const content = `
\`\`\`yaml
agent:
  id: "${name.toLowerCase()}"
  name: ${name}
  core_protocols:
    - role: system
      content: You are the ${name} agent.
  engine_tools: ["file_system.*", "stigmergy.*", "system.*"]
\`\`\`
`;
        mockFsExtra.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    createAgentFile('Specifier');
    createAgentFile('QA');
    createAgentFile('Dispatcher');

    engine = new Stigmergy({
        _test_streamText: mockStreamText,
        _test_fs: mockFsExtra,
        stateManager: mockStateManagerInstance,
        projectRoot: projectRoot,
        corePath: corePath,
        startServer: false,
    });

    // Spy ONLY on the final outcome we want to test: the file write.
    writeFileSpy = spyOn(mockFsExtra, 'writeFile');
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
    delete process.env.STIGMERGY_CORE_PATH;
});

test("Isolation Test: Manually-triggered workflow should execute correctly", async () => {
    const filePath = "hello.txt";
    const fileContent = "Hello, world!";

    // --- ISOLATION TEST: Manually trigger each agent in sequence ---

    // 1. Mock AI for Specifier -> returns plan
    mockStreamText.mockResolvedValueOnce({ text: 'Here is the plan.', finishReason: 'stop' });
    await engine.triggerAgent('@specifier', "Create a plan.");

    // 2. Mock AI for QA -> returns approval
    mockStreamText.mockResolvedValueOnce({ text: 'LGTM.', finishReason: 'stop' });
    await engine.triggerAgent('@qa', "Review the plan.");

    // 3. Mock AI for Dispatcher -> writes file and updates status
    mockStreamText
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: filePath, content: fileContent } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Done.', finishReason: 'stop' });

    // Manually trigger the agent responsible for the file write
    await engine.triggerAgent('@dispatcher', 'The plan is approved. Please write the file.');

    // Verify the file was written correctly INSIDE THE DISPATCHER'S SANDBOX
    const expectedPath = path.join(projectRoot, '.stigmergy', 'sandboxes', 'dispatcher', filePath);
    expect(writeFileSpy).toHaveBeenCalledTimes(1);
    expect(writeFileSpy).toHaveBeenCalledWith(expectedPath, fileContent);

    // Verify the final status was updated
    const statusUpdateCall = mockStateManagerInstance.updateStatus.mock.calls.find(call => call[0].newStatus === 'EXECUTION_COMPLETE');
    expect(statusUpdateCall).toBeDefined();
});