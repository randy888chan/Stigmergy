import { mock, spyOn, test, expect, beforeEach, afterEach } from "bun:test";
import { Engine as Stigmergy } from "../../../engine/server.js";
import path from "path";
import { Volume } from 'memfs';

// --- Create a self-contained, in-memory file system for this test ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

// Create a mock that mimics the 'fs-extra' API using our in-memory file system.
const mockFs = {
  // Promise-based async methods
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  copy: memfs.promises.copyFile,
  remove: (p) => memfs.promises.rm(p, { recursive: true, force: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,

  // Sync methods
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  readFileSync: memfs.readFileSync,

  // Add other methods used by the code under test
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
  // Add the promises object for compatibility
  promises: memfs.promises
};
// Add default export for compatibility
mockFs.default = mockFs;

// --- Mock the fs-extra module FOR THIS TEST FILE ---
// This will intercept all imports of 'fs-extra' within the engine as well.
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

let engine;
let executeSpy;

// A mock for the streamText function to simulate LLM responses
const mockStreamText = mock();

beforeEach(async () => {
    // Reset the in-memory volume before each test
    vol.reset();

    engine = new Stigmergy({
        _test_streamText: mockStreamText,
        stateManager: mockStateManagerInstance
    });
    executeSpy = spyOn(engine.executeTool, 'execute');

    // --- Setup mock files and directories IN-MEMORY ---
    const tempDir = path.join(process.cwd(), '.tmp');
    mockFs.ensureDirSync(tempDir);

    const agentDir = path.join(tempDir, '.stigmergy-core', 'agents');
    mockFs.ensureDirSync(agentDir);

    // Create the mock agent file with the correct nested YAML structure.
    const analystAgentContent = `
\`\`\`yaml
agent:
  name: Analyst
  description: A research agent that performs deep dives and evaluates sources.
  persona: A helpful research assistant.
  core_protocols:
    - research
    - reporting
\`\`\`

This agent is designed for research.
`;
    mockFs.writeFileSync(path.join(agentDir, 'analyst.md'), analystAgentContent);

    // Override the agent loading path to point to our in-memory temp directory
    spyOn(process, 'cwd').mockReturnValue(tempDir);
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
});

test("Research workflow triggers deep_dive, evaluate_sources, and reports with confidence", async () => {
    const researchTopic = "What is the impact of AI on software development?";

    // Simulate the multi-step agent conversation
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '1', toolName: 'research.deep_dive', args: { query: 'impact of AI on SWE' } }],
        finishReason: 'tool-calls',
    });
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '2', toolName: 'research.deep_dive', args: { query: 'AI in software testing' } }],
        finishReason: 'tool-calls',
    });
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '3', toolName: 'research.evaluate_sources', args: { urls: ['http://a.com', 'http://b.com'] } }],
        finishReason: 'tool-calls',
    });
    mockStreamText.mockResolvedValueOnce({
        text: "Final Report...\n\n**Confidence Score:** High...",
        finishReason: 'stop',
    });

    // Mock the tool outputs
    executeSpy.mockImplementation(async (toolName, args) => {
        if (toolName === 'research.deep_dive') {
            return { new_learnings: `Learnings from ${args.query}`, sources: ['http://a.com', 'http://b.com'] };
        }
        if (toolName === 'research.evaluate_sources') {
            return [{ url: 'http://a.com', credibility_score: 9, justification: 'Good.' }];
        }
        return {};
    });

    await engine.triggerAgent("@analyst", researchTopic);

    // Assert that research.deep_dive was called at least twice
    const deepDiveCalls = executeSpy.mock.calls.filter(call => call[0] === 'research.deep_dive');
    expect(deepDiveCalls.length).toBeGreaterThanOrEqual(2);

    // Assert that research.evaluate_sources was called
    const evaluateSourcesCalls = executeSpy.mock.calls.filter(call => call[0] === 'research.evaluate_sources');
    expect(evaluateSourcesCalls.length).toBe(1);

    expect(mockStreamText).toHaveBeenCalledTimes(4);
});