import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

let Stigmergy;
const mockStreamText = mock();

describe("Full E2E Workflow (Isolated)", () => {
    let engine;
    let projectRoot;
    let writeFileSpy;

    beforeEach(async () => {
        vol.reset(); // PRISTINE STATE
        mockStreamText.mockClear();

        mock.module('fs', () => mockFs);
        mock.module('fs-extra', () => mockFs);
        mock.module('ai', () => ({ streamText: mockStreamText }));
        mock.module('../../../services/config_service.js', () => ({
            configService: {
                getConfig: () => ({
                    model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                    providers: { mock_provider: { api_key: 'mock-key' } }
                }),
            },
        }));

        Stigmergy = (await import("../../../engine/server.js")).Engine;

        projectRoot = path.resolve('/test-project');
        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.ensureDir(agentDir);

        const createAgentFile = async (name) => {
            const content = `
\`\`\`yaml
agent:
  id: "@${name.toLowerCase()}"
  name: ${name}
  core_protocols:
    - role: system
      content: You are the ${name} agent.
  engine_tools: ["file_system.*", "stigmergy.*", "system.*"]
\`\`\`
`;
            await mockFs.promises.writeFile(path.join(agentDir, `${name.toLowerCase()}.md`), content);
        };

        await createAgentFile('Specifier');
        await createAgentFile('QA');
        await createAgentFile('Dispatcher');

        const stateManager = new GraphStateManager(projectRoot);
        engine = new Stigmergy({
            _test_streamText: mockStreamText,
            _test_fs: mockFs,
            projectRoot: projectRoot,
            corePath: process.env.STIGMERGY_CORE_PATH,
            stateManager,
            startServer: false,
        });

        writeFileSpy = spyOn(mockFs.promises, 'writeFile');
    });

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
        mock.restore();
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test("Isolation Test: Manually-triggered workflow should execute correctly", async () => {
        const filePath = "hello.txt";
        const fileContent = "Hello, world!";

        // The mock sequence must now include the final status update.
        const dispatcherToolCalls = [
            { toolCallId: '1', toolName: 'file_system.writeFile', args: { path: filePath, content: fileContent } },
            { toolCallId: '2', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }
        ];
        mockStreamText
            .mockResolvedValueOnce({ text: 'Plan created.', finishReason: 'stop' }) // Specifier
            .mockResolvedValueOnce({ text: 'Plan approved.', finishReason: 'stop' }) // QA
            .mockResolvedValueOnce({ toolCalls: dispatcherToolCalls, finishReason: 'tool-calls' }) // Dispatcher
            .mockResolvedValueOnce({ text: 'All tasks are complete.', finishReason: 'stop' }); // Final response

        // Correct agent IDs must be used
        await engine.triggerAgent('@specifier', "Create a plan.");
        await engine.triggerAgent('@qa', "Review the plan.");
        await engine.triggerAgent('@dispatcher', 'The plan is approved. Please write the file.');

        // The path is now resolved inside the executor, so we check the sandboxed path.
        const expectedPath = path.join(projectRoot, '.stigmergy', 'sandboxes', 'dispatcher', filePath);

        // More robust check: verify the file content directly.
        const actualContent = await mockFs.promises.readFile(expectedPath, 'utf-8');
        expect(actualContent).toBe(fileContent);

        const finalState = await engine.stateManager.getState();
        expect(finalState.project_status).toBe('EXECUTION_COMPLETE');
    });
});
