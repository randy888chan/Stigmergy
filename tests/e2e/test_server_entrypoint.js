import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';
import path from 'path';

// This is the mock AI logic, moved from the test file.
const mockStreamText = async ({ messages }) => {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.role === 'user' ? lastMessage.content : `[Received tool result for ${lastMessage.tool_name}]`;

    if (prompt.includes('create the initial `plan.md`')) {
        return { toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review...' } }], finishReason: 'tool-calls' };
    }
    if (prompt.includes('Please review')) {
        return { toolCalls: [{ toolCallId: 'c2', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'Plan approved. Execute.' } }], finishReason: 'tool-calls' };
    }
    if (prompt.includes('Execute')) {
        return { toolCalls: [{ toolCallId: 'c3', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }], finishReason: 'tool-calls' };
    }
    // Check the tool name from the message, not the content
    if (lastMessage.role === 'tool' && lastMessage.tool_name === 'file_system.writeFile') {
        return { toolCalls: [{ toolCallId: 'c4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' };
    }
    return { text: '', finishReason: 'stop' };
};


// The main function to run the server
async function main() {
    const PORT = process.env.STIGMERGY_PORT || 3019;

    // The test will pass the actual project root via an env var.
    // The CWD will be the temporary test directory.
    const projectRoot = process.env.E2E_PROJECT_ROOT || process.cwd();
    const stateManager = new GraphStateManager(projectRoot);

    const engine = new Engine({
        stateManager,
        projectRoot, // Pass the correct project root to the engine
        _test_streamText: mockStreamText
    });

    await engine.start();
    console.log(`E2E Test Server running on port ${PORT}. Project root: ${projectRoot}. CWD: ${process.cwd()}`);
}

main().catch(err => {
    console.error("Failed to start E2E test server:", err);
    process.exit(1);
});