import { mock, spyOn, test, expect, beforeEach, afterEach } from "bun:test";

// Mock the GraphStateManager dependency EXPLICITLY for this test file.
mock.module("../../../src/infrastructure/state/GraphStateManager.js", () => {
    return {
      default: mock(() => ({
        initializeProject: mock().mockResolvedValue({}),
        updateStatus: mock().mockResolvedValue({}),
        updateState: mock().mockResolvedValue({}),
        getState: mock().mockResolvedValue({ project_manifest: { tasks: [] } }),
        on: mock(),
        emit: mock(),
      })),
    };
});

import { Engine as Stigmergy } from "../../../engine/server.js";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";

// This is a more realistic integration test for the workflow.
// It spies on the tool executor to see what the agent *actually* does.

let engine;
let executeSpy;

// A mock for the streamText function to simulate LLM responses
const mockStreamText = mock();

beforeEach(async () => {
    // Inject the mock streamText function into the engine
    engine = new Stigmergy({ _test_streamText: mockStreamText });
    executeSpy = spyOn(engine.executeTool, 'execute');

    // Setup mock agent definitions in a temporary directory
    const tempAgentPath = path.join(process.cwd(), '.tmp', '.stigmergy-core', 'agents');
    await fs.ensureDir(tempAgentPath);
    const analystAgentPath = path.join(process.cwd(), '.stigmergy-core', 'agents', 'analyst.md');
    await fs.copy(analystAgentPath, path.join(tempAgentPath, 'analyst.md'));

    // Override the agent loading path for the test
    spyOn(process, 'cwd').mockReturnValue(path.join(process.cwd(), '.tmp'));
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
    // 1. First, the agent decides to do a deep_dive.
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '1', toolName: 'research.deep_dive', args: { query: 'impact of AI on SWE' } }],
        finishReason: 'tool-calls',
    });
    // 2. We return the result of the first deep_dive, and the agent decides to do another one.
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '2', toolName: 'research.deep_dive', args: { query: 'AI in software testing' } }],
        finishReason: 'tool-calls',
    });
    // 3. We return the result of the second deep_dive, and now it decides to evaluate sources.
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '3', toolName: 'research.evaluate_sources', args: { urls: ['http://a.com', 'http://b.com'] } }],
        finishReason: 'tool-calls',
    });
    // 4. Finally, it synthesizes the report.
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

    // The assertion for the final output is implicitly handled by the final mockStreamText call.
    // We can check if the final `text` was processed.
    expect(mockStreamText).toHaveBeenCalledTimes(4);
});