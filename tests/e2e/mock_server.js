import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';

// This is the "script" for our mock AI's conversation.
const mockStreamText = async ({ messages }) => {
    const lastMessage = messages[messages.length - 1];
    const prompt = lastMessage.role === 'user' ? lastMessage.content : `[Received tool result for ${lastMessage.tool_name}]`;

    if (prompt.includes('create the initial `plan.md`')) {
        return { toolCalls: [{ toolCallId: 'c1', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review...' } }], finishReason: 'tool-calls' };
    }
    if (prompt.includes('Please review')) {
        // 2. @tools/qa_tools.js is triggered, approves the plan by DELEGATING to the dispatcher.
        return {
            toolCalls: [{ toolCallId: 'c_qa_approve', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'The plan has been approved. Begin executing the tasks in plan.md.' } }],
            finishReason: 'tool-calls'
        };
    }
    if (prompt.includes('Begin executing')) {
        return { toolCalls: [{ toolCallId: 'c3', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }], finishReason: 'tool-calls' };
    }
    if (lastMessage.tool_name === 'file_system.writeFile') {
        return { toolCalls: [{ toolCallId: 'c4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' };
    }
    return { text: '', finishReason: 'stop' };
};

const stateManager = new GraphStateManager();
const engine = new Engine({ stateManager, _test_streamText: mockStreamText });

console.log('Starting mock server...');
engine.start().then(() => {
    console.log('Mock server started successfully.');
}).catch(err => {
    console.error('Failed to start mock server:', err);
    process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('SIGINT received. Shutting down mock server...');
    await engine.stop();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down mock server...');
    await engine.stop();
    process.exit(0);
});