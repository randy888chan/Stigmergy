import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
import { Engine as Stigmergy } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from "../../../engine/tool_executor.js";
import path from "path";
import { Volume } from 'memfs';

// --- Create a self-contained, in-memory file system for this test ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

const mockFsExtra = {
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  copy: memfs.promises.copyFile,
  remove: (p) => memfs.promises.rm(p, { recursive: true, force: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  promises: memfs.promises,
};
mockFsExtra.default = mockFsExtra;

// Mock fs-extra for our direct usage
mock.module('fs-extra', () => mockFsExtra);
// ALSO MOCK NATIVE FS for libraries like @hono/node-server/serve-static
mock.module('fs', () => memfs);
mock.module('fs/promises', () => memfs.promises);

// Mock the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    on: mock(),
    emit: mock(),
};

// Create a single, persistent mock function for the executor
const executeMock = mock().mockResolvedValue(JSON.stringify({ success: true }));
const mockStreamText = mock();

let engine;

beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    executeMock.mockClear(); // Clear the shared mock before each test

    const projectRoot = path.join(process.cwd(), 'test-project');
    const agentDir = path.join(projectRoot, '.stigmergy-core', 'agents');
    const trajectoryDir = path.join(projectRoot, '.stigmergy', 'trajectories');
    const dashboardDir = path.join(projectRoot, 'dashboard', 'public');
    mockFsExtra.ensureDirSync(agentDir);
    mockFsExtra.ensureDirSync(trajectoryDir);
    mockFsExtra.ensureDirSync(dashboardDir);

    const createAgentFile = (name) => {
        const content = `
\`\`\`yaml
agent:
  id: "${name.toLowerCase()}"
  engine_tools: ["file_system.*", "stigmergy.*"]
\`\`\`
`;
        mockFsExtra.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    createAgentFile('Specifier');
    createAgentFile('QA');
    createAgentFile('Dispatcher');

    // Dependency injection for the tool executor.
    // Each time a new executor is created, we replace its 'execute' method
    // with our persistent mock function.
    const testExecutorFactory = (engine, ai, options) => {
        const executor = realCreateExecutor(engine, ai, options);
        executor.execute = executeMock; // Use the same mock for all instances
        return executor;
    };

    engine = new Stigmergy({
        _test_streamText: mockStreamText,
        _test_createExecutor: testExecutorFactory, // Inject the factory
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
        // 1. Specifier is triggered, decides to delegate to QA
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: `Review this: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Okay, delegating to QA.', finishReason: 'stop' })

        // 2. QA is triggered, reviews, and requests revision
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'revision_needed', feedback: 'Missing details.' }), finishReason: 'stop' })

        // 3. Specifier is triggered again, decides to delegate to QA again
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: `Review this revised plan: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'Okay, delegating revised plan to QA.', finishReason: 'stop' })

        // 4. QA is triggered again, approves
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'approved', feedback: 'Looks good.' }), finishReason: 'stop' })

        // 5. Dispatcher is triggered, writes the file
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: 'plan.md', content: draftPlan } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: 'File written.', finishReason: 'stop' });

    await engine.triggerAgent('@specifier', 'Create a new plan');
    await engine.triggerAgent('@qa', `Review this: ${draftPlan}`);
    await engine.triggerAgent('@specifier', 'Revise plan based on feedback: Missing details.');
    await engine.triggerAgent('@qa', `Review this revised plan: ${draftPlan}`);
    await engine.triggerAgent('@dispatcher', 'The plan is approved. Write it to disk.');

    expect(executeMock).toHaveBeenCalledTimes(3); // stigmergy.task, stigmergy.task, file_system.writeFile
    expect(executeMock).toHaveBeenCalledWith('file_system.writeFile', expect.objectContaining({ path: 'plan.md' }), 'dispatcher');
});