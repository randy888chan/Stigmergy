import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
import { Engine as Stigmergy } from "../../../engine/server.js";
import fs from "fs-extra";
import path from "path";

let engine;
let executeSpy;
const mockStreamText = mock();

beforeEach(async () => {
    engine = new Stigmergy({ _test_streamText: mockStreamText });
    executeSpy = spyOn(engine.executeTool, 'execute');

    // Setup mock agent definitions
    const tempAgentPath = path.join(process.cwd(), '.tmp', '.stigmergy-core', 'agents');
    await fs.ensureDir(tempAgentPath);
    const agentFiles = ['specifier.md', 'qa.md', 'dispatcher.md'];
    for (const file of agentFiles) {
        const sourcePath = path.join(process.cwd(), '.stigmergy-core', 'agents', file);
        const destPath = path.join(tempAgentPath, file);
        await fs.copy(sourcePath, destPath);
    }
    spyOn(process, 'cwd').mockReturnValue(path.join(process.cwd(), '.tmp'));
});

afterEach(async () => {
    if (engine) {
        await engine.stop();
    }
    mock.restore();
});

test("Planning workflow simulates the full review and refine loop", async () => {
    const draftPlan = "id: task-1...";

    // --- Mock Setup ---
    // This setup accounts for the agent loop continuing after a tool call.

    // 1. @specifier is triggered, decides to call stigmergy.task
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '1', toolName: 'stigmergy.task', args: { agent_id: '@qa', prompt: `Review this: ${draftPlan}` } }],
        finishReason: 'tool-calls',
    });
    // After the tool call, the agent loop runs again and finishes.
    mockStreamText.mockResolvedValueOnce({ text: '', finishReason: 'stop' });

    // 2. @qa is triggered for review, returns JSON with "revision_needed"
    mockStreamText.mockResolvedValueOnce({
        text: JSON.stringify({ status: 'revision_needed', feedback: 'Missing details.' }),
        finishReason: 'stop',
    });

    // 3. @specifier is triggered again, decides to call stigmergy.task
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '2', toolName: 'stigmergy.task', args: { agent_id: '@qa', prompt: `Review this revised plan: ${draftPlan}` } }],
        finishReason: 'tool-calls',
    });
    // After the tool call, the agent loop runs again and finishes.
    mockStreamText.mockResolvedValueOnce({ text: '', finishReason: 'stop' });

    // 4. @qa is triggered again, returns "approved"
    mockStreamText.mockResolvedValueOnce({
        text: JSON.stringify({ status: 'approved', feedback: 'Looks good.' }),
        finishReason: 'stop',
    });

    // 5. @dispatcher is triggered, decides to write the file
    mockStreamText.mockResolvedValueOnce({
        toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: 'plan.md', content: draftPlan } }],
        finishReason: 'tool-calls',
    });
    // After the tool call, the agent loop runs again and finishes.
    mockStreamText.mockResolvedValueOnce({ text: '', finishReason: 'stop' });

    // Mock the tool executions. We only care that they are called.
    executeSpy.mockResolvedValue({});

    // --- Start the workflow ---
    // We manually trigger each agent to simulate the dispatcher's logic.

    // Specifier creates first draft and sends for review
    await engine.triggerAgent('@specifier', 'Create a new plan');

    // QA requests revision
    await engine.triggerAgent('@qa', `Review this: ${draftPlan}`);

    // Specifier creates second draft and sends for review
    await engine.triggerAgent('@specifier', 'Revise plan based on feedback: Missing details.');

    // QA approves
    await engine.triggerAgent('@qa', `Review this revised plan: ${draftPlan}`);

    // Dispatcher writes the final file
    await engine.triggerAgent('@dispatcher', 'The plan is approved. Write it to disk.');

    // --- Assertions ---
    // Verify the correct tool calls were made in the correct order.
    expect(executeSpy).toHaveBeenCalledWith('stigmergy.task', expect.objectContaining({ agent_id: '@qa' }), 'specifier');
    expect(executeSpy).toHaveBeenCalledWith('file_system.writeFile', expect.objectContaining({ path: 'plan.md' }), 'dispatcher');

    const writeFileCalls = executeSpy.mock.calls.filter(call => call[0] === 'file_system.writeFile');
    expect(writeFileCalls.length).toBe(1);
});