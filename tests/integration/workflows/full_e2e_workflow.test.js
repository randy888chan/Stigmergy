import { spyOn, mock, test, expect, beforeEach, afterEach } from "bun:test";
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
  id: "${name.toLowerCase()}"
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

        spyOn(engine.stateManager, 'updateStatus').mockResolvedValue({});

        // 1. Mock AI for Specifier -> returns plan
        mockStreamText.mockResolvedValueOnce({ text: 'Here is the plan.', finishReason: 'stop' });
        await engine.triggerAgent('@specifier', "Create a plan.");

        // 2. Mock AI for QA -> returns approval
        mockStreamText.mockResolvedValueOnce({ text: 'LGTM.', finishReason: 'stop' });
        await engine.triggerAgent('@qa', "Review the plan.");

        // 3. Mock AI for Dispatcher -> writes file and updates status
        mockStreamText
            .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'file_system.writeFile', args: { path: filePath, content: fileContent } }], finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '4', toolName: 'system.updateStatus', args: { newStatus: 'EXECUTION_COMPLETE' } }], finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ text: 'Done.', finishReason: 'stop' });

        await engine.triggerAgent('@dispatcher', 'The plan is approved. Please write the file.');

        const expectedPath = path.join(projectRoot, '.stigmergy', 'sandboxes', 'dispatcher', filePath);
        expect(writeFileSpy).toHaveBeenCalledWith(expectedPath, fileContent);

        const statusUpdateCall = engine.stateManager.updateStatus.mock.calls.find(call => call[0].newStatus === 'EXECUTION_COMPLETE');
        expect(statusUpdateCall).toBeDefined();
    });
});
