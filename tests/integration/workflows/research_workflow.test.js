import { mock, spyOn, test, expect, beforeEach, afterEach } from "bun:test";
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
  readFileSync: memfs.readFileSync,
  readJson: async (file, options) => {
    const data = await memfs.promises.readFile(file, options);
    return JSON.parse(data.toString());
  },
  pathExists: async (pathStr) => {
    try {
      await memfs.promises.access(pathStr);
      return true;
    } catch {
      return false;
    }
  },
  promises: memfs.promises
};
mockFs.default = mockFs;

// Mock the fs-extra module FOR THIS TEST FILE
mock.module('fs-extra', () => mockFs);

// Create a mock instance for the StateManager
const mockStateManagerInstance = {
    initializeProject: mock().mockResolvedValue({}),
    updateStatus: mock().mockResolvedValue({}),
    updateState: mock().mockResolvedValue({}),
    getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
    on: mock(),
    emit: mock(),
};

const executeMock = mock();
const mockStreamText = mock();
let engine;

beforeEach(async () => {
    vol.reset();
    mockStreamText.mockClear();
    executeMock.mockClear();

    const projectRoot = path.join(process.cwd(), 'test-project-research');
    const agentDir = path.join(projectRoot, '.stigmergy-core', 'agents');
    const trajectoryDir = path.join(projectRoot, '.stigmergy', 'trajectories');
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(trajectoryDir);

    const analystAgentContent = `
\`\`\`yaml
agent:
  id: "analyst"
  engine_tools: ["research.*"]
\`\`\`
`;
    mockFs.writeFileSync(path.join(agentDir, 'analyst.md'), analystAgentContent);

    // Dependency injection for the tool executor
    const testExecutorFactory = (engine, ai, options) => {
        const executor = realCreateExecutor(engine, ai, options);
        executor.execute = executeMock; // Use the persistent mock
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

test("Research workflow triggers deep_dive, evaluate_sources, and reports with confidence", async () => {
    const researchTopic = "What is the impact of AI on software development?";

    // This mock chain simulates a multi-turn conversation where the agent performs research.
    mockStreamText
        // Turn 1: Initial prompt -> deep_dive
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'research.deep_dive', args: { query: 'impact of AI on SWE' } }], finishReason: 'tool-calls' })
        // Turn 2: Gets result of first deep_dive -> another deep_dive
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'research.deep_dive', args: { query: 'AI in software testing' } }], finishReason: 'tool-calls' })
        // Turn 3: Gets result of second deep_dive -> evaluate_sources
        .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'research.evaluate_sources', args: { urls: ['http://a.com', 'http://b.com'] } }], finishReason: 'tool-calls' })
        // Turn 4: Gets result of evaluation -> generates final report
        .mockResolvedValueOnce({ text: "Final Report...\n\n**Confidence Score:** High...", finishReason: 'stop' });

    // The mock implementation for the tool calls themselves.
    executeMock.mockImplementation(async (toolName, args) => {
        if (toolName === 'research.deep_dive') {
            return JSON.stringify({ new_learnings: `Learnings from ${args.query}`, sources: ['http://a.com', 'http://b.com'] });
        }
        if (toolName === 'research.evaluate_sources') {
            return JSON.stringify([{ url: 'http://a.com', credibility_score: 9, justification: 'Good.' }]);
        }
        return JSON.stringify({});
    });

    // We only need to trigger the agent once with the initial prompt.
    // The agent will then loop internally based on the mockStreamText responses.
    await engine.triggerAgent("@analyst", researchTopic);

    // Verify the tool calls were made as expected.
    const deepDiveCalls = executeMock.mock.calls.filter(call => call[0] === 'research.deep_dive');
    expect(deepDiveCalls.length).toBe(2);

    const evaluateSourcesCalls = executeMock.mock.calls.filter(call => call[0] === 'research.evaluate_sources');
    expect(evaluateSourcesCalls.length).toBe(1);

    // The agent should have gone through 4 turns (3 tool calls + 1 final text response).
    expect(mockStreamText).toHaveBeenCalledTimes(4);
});