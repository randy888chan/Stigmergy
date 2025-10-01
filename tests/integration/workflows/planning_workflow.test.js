import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
import { Engine as Stigmergy } from "../../../engine/server.js";
import path from "path";
import { Volume } from 'memfs';

// --- Create a self-contained, in-memory file system for this test ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

// Create a comprehensive mock that mimics the 'fs-extra' API.
const mockFs = {
  // Promise-based async methods that the engine and tools use
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  copy: memfs.promises.copyFile,
  remove: (p) => memfs.promises.rm(p, { recursive: true, force: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,

  // Sync methods used for test setup
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,

  // Add the promises object for compatibility
  promises: memfs.promises,
};
mockFs.default = mockFs;

// --- Mock the fs-extra module FOR THIS TEST FILE ---
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

    engine = new Stigmergy({
        _test_streamText: mockStreamText,
        stateManager: mockStateManagerInstance
    });
    executeSpy = spyOn(engine.executeTool, 'execute');

    // --- Setup mock agent definitions IN-MEMORY ---
    const tempDir = path.join(process.cwd(), '.tmp');
    mockFs.ensureDirSync(tempDir);
    const agentDir = path.join(tempDir, '.stigmergy-core', 'agents');
    mockFs.ensureDirSync(agentDir);

    const createAgentFile = (name, description, protocols = []) => {
        const content = `
\`\`\`yaml
agent:
  name: ${name}
  description: ${description}
  persona: A helpful assistant.
  core_protocols: [${protocols.map(p => `"${p}"`).join(', ')}]
\`\`\`
This is the ${name} agent.`;
        mockFs.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
    };

    createAgentFile('Specifier', 'Creates plans', ['planning']);
    createAgentFile('QA', 'Reviews plans', ['review']);
    createAgentFile('Dispatcher', 'Dispatches tasks', ['dispatch']);

    spyOn(process, 'cwd').mockReturnValue(tempDir);
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
});

test("Planning workflow simulates the full review and refine loop", async () => {
    const draftPlan = "id: task-1...";

    // Mock LLM responses for the entire sequence
    mockStreamText
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'stigmergy.task', args: { agent_id: '@qa', prompt: `Review this: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: '', finishReason: 'stop' })
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'revision_needed', feedback: 'Missing details.' }), finishReason: 'stop' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'stigmergy.task', args: { agent_id: '@qa', prompt: `Review this revised plan: ${draftPlan}` } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: '', finishReason: 'stop' })
        .mockResolvedValueOnce({ text: JSON.stringify({ status: 'approved', feedback: 'Looks good.' }), finishReason: 'stop' })
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: 'plan.md', content: draftPlan } }], finishReason: 'tool-calls' })
        .mockResolvedValueOnce({ text: '', finishReason: 'stop' });

    executeSpy.mockResolvedValue({});

    // Trigger the sequence of agent interactions
    await engine.triggerAgent('@specifier', 'Create a new plan');
    await engine.triggerAgent('@qa', `Review this: ${draftPlan}`);
    await engine.triggerAgent('@specifier', 'Revise plan based on feedback: Missing details.');
    await engine.triggerAgent('@qa', `Review this revised plan: ${draftPlan}`);
    await engine.triggerAgent('@dispatcher', 'The plan is approved. Write it to disk.');

    // Assert the final tool call was made correctly
    expect(executeSpy).toHaveBeenCalledWith('file_system.writeFile', expect.objectContaining({ path: 'plan.md' }), 'dispatcher');
});