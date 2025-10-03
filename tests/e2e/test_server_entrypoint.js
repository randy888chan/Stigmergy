import { Engine } from '../../engine/server.js';
import { GraphStateManager } from '../../src/infrastructure/state/GraphStateManager.js';
import path from 'path';

// This is the definitive mock AI logic that correctly simulates the agent swarm workflow.
const mockStreamText = async ({ messages }) => {
    const lastMessage = messages[messages.length - 1];

    const getAgentFromSystemPrompt = (msgs) => {
        const systemMessage = msgs.find(m => m.role === 'system');
        if (!systemMessage || !systemMessage.content) return null;
        if (systemMessage.content.includes('I am the Specifier')) return '@specifier';
        if (systemMessage.content.includes('I am Quinn')) return '@qa';
        if (systemMessage.content.includes('I am Saul')) return '@dispatcher';
        return null;
    };

    const currentAgent = getAgentFromSystemPrompt(messages);

    switch (currentAgent) {
        case '@specifier':
            // Specifier's only job is to delegate to QA. After that, it's done.
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'stigmergy.task') {
                return { text: 'Specifier task delegated. Stopping.', finishReason: 'stop' };
            }
            return {
                toolCalls: [{ toolCallId: 'spec-to-qa', toolName: 'stigmergy.task', args: { subagent_type: '@qa', description: 'Please review the plan.' } }],
                finishReason: 'tool-calls'
            };

        case '@qa':
            // QA's only job is to delegate to the Dispatcher. After that, it's done.
            if (lastMessage.role === 'tool' && lastMessage.tool_name === 'stigmergy.task') {
                return { text: 'QA task delegated. Stopping.', finishReason: 'stop' };
            }
            return {
                toolCalls: [{ toolCallId: 'qa-to-dispatcher', toolName: 'stigmergy.task', args: { subagent_type: '@dispatcher', description: 'Plan approved. Execute.' } }],
                finishReason: 'tool-calls'
            };

        case '@dispatcher':
            // Dispatcher has a two-step job.
            const hasWrittenFile = messages.some(m => m.role === 'tool' && m.tool_name === 'file_system.writeFile');

            if (!hasWrittenFile) {
                // Step 1: Write the file. The loop will continue for the next step.
                return {
                    toolCalls: [{ toolCallId: 'dispatch-write', toolName: 'file_system.writeFile', args: { path: 'src/output.js', content: 'Hello World' } }],
                    finishReason: 'tool-calls'
                };
            } else {
                // Step 2: Update the status. After this, the dispatcher is done.
                 if (lastMessage.role === 'tool' && lastMessage.tool_name === 'system.updateStatus') {
                    return { text: 'Dispatcher finished. Stopping.', finishReason: 'stop' };
                }
                return {
                    toolCalls: [{ toolCallId: 'dispatch-complete', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }],
                    finishReason: 'tool-calls'
                };
            }

        default:
            return { text: 'Unknown agent or final step. Stopping.', finishReason: 'stop' };
    }
};

async function main() {
    const PORT = process.env.STIGMERGY_PORT || 3019;
    const projectRoot = process.env.E2E_PROJECT_ROOT || process.cwd();

    const stateManager = new GraphStateManager();

    const engine = new Engine({
        stateManager,
        projectRoot,
        _test_streamText: mockStreamText
    });

    await engine.start();
    console.log(`E2E Test Server running on port ${PORT}. Project root: ${projectRoot}. CWD: ${process.cwd()}`);
}

main().catch(err => {
    console.error("Failed to start E2E test server:", err);
    process.exit(1);
});