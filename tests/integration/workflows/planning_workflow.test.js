import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
import { Engine as Stigmergy } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";
import path from "path";
import { Volume } from 'memfs';

// --- Create a self-contained, in-memory file system for this test ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

const mockFs = {
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  copy: memfs.promises.copyFile,
  remove: (p) => memfs.promises.rm(p, { recursive: true, force: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  promises: memfs.promises,
};
mockFs.default = mockFs;

// Mock the fs-extra module for the entire test file
mock.module('fs-extra', () => mockFs);

// Mock the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    on: mock(),
    emit: mock(),
};

let engine;
let executeSpy;
const mockStreamText = mock();

beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    if (executeSpy) executeSpy.mockClear();

    const projectRoot = path.join(process.cwd(), 'test-project');
    const agentDir = path.join(projectRoot, '.stigmergy-core', 'agents');
    const trajectoryDir = path.join(projectRoot, '.stigmergy', 'trajectories');
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(trajectoryDir);

    const createAgentFile = (name) => {
        const content = `
\`\`\`yaml
agent:
  id: "${name.toLowerCase()}"
  engine_tools: ["file_system.*", "stigmergy.*"]
\`\`\`
`;
        mockFs.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    createAgentFile('Specifier');
    createAgentFile('QA');
    createAgentFile('Dispatcher');

    // This is the dependency injection pattern.
    // We create a function that will be passed to the engine to construct the tool executor.
    const testExecutorFactory = (engine, ai, options) => {
        const executor = realCreateExecutor(engine, ai, options);
        executeSpy = spyOn(executor, 'execute').mockResolvedValue(JSON.stringify({ success: true }));
        return executor;
    };

    engine = new Stigmergy({
        _test_streamText: mockStreamText,
        _test_createExecutor: testExecutorFactory, // Inject the factory here
        stateManager: mockStateManagerInstance,
        projectRoot: projectRoot,
    });
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
});

test("Planning workflow simulates the full review and refine loop", async () => {
    const draftPlan = "id: task-1...";

    mockStreamText
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: `Review this: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'revision_needed', feedback: 'Missing details.' }), finishReason: 'stop' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: `Review this revised plan: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'approved', feedback: 'Looks good.' }), finishReason: 'stop' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: 'plan.md', content: draftPlan } }], finishReason: 'tool-calls' });

    await engine.triggerAgent('@specifier', 'Create a new plan');
    await engine.triggerAgent('@qa', `Review this: ${draftPlan}`);
    await engine.triggerAgent('@specifier', 'Revise plan based on feedback: Missing details.');
    await engine.triggerAgent('@qa', `Review this revised plan: ${draftPlan}`);
    await engine.triggerAgent('@dispatcher', 'The plan is approved. Write it to disk.');

    expect(executeSpy).toHaveBeenCalledWith('file_system.writeFile', expect.objectContaining({ path: 'plan.md' }), 'dispatcher');
});