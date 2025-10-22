import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

let Stigmergy;
let realCreateExecutor;
const executeMock = mock().mockResolvedValue(JSON.stringify({ success: true }));
const mockStreamText = mock();
let engine;
let projectRoot;

describe("Phase-Based E2E Test: Planning and Review Handoff", () => {
    beforeEach(async () => {
        vol.reset();
        mockStreamText.mockClear();
        executeMock.mockClear();

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
        realCreateExecutor = (await import("../../../engine/tool_executor.js")).createExecutor;

        projectRoot = path.resolve('/test-project-planning');
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
      engine_tools: ["stigmergy.task"]
    \`\`\`
    `;
            await mockFs.promises.writeFile(path.join(agentDir, `${name.toLowerCase()}.md`), content);
        };

        await createAgentFile('Specifier');
        await createAgentFile('QA');

        const testExecutorFactory = async (engine, ai, options) => {
            const executor = await realCreateExecutor(engine, ai, options, mockFs);
            executor.execute = executeMock;
            return executor;
        };

        const stateManager = new GraphStateManager(projectRoot);
        engine = new Stigmergy({
            _test_streamText: mockStreamText,
            _test_createExecutor: testExecutorFactory,
            _test_fs: mockFs,
            projectRoot: projectRoot,
            stateManager,
            startServer: false,
        });
    });

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
        mock.restore();
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test("Specifier should correctly delegate a plan to the QA agent", async () => {
        const goal = "Create a plan for a simple file.";

        mockStreamText
            .mockResolvedValueOnce({
                toolCalls: [{
                    toolCallId: '1',
                    toolName: 'stigmergy.task',
                    args: { subagent_type: '@qa', description: 'Please review the generated plan.' }
                }],
                finishReason: 'tool-calls'
            })
            .mockResolvedValueOnce({ text: 'Delegating to QA for review.', finishReason: 'stop' });

        await engine.triggerAgent('@specifier', goal);

        expect(executeMock).toHaveBeenCalledTimes(1);
        expect(executeMock).toHaveBeenCalledWith(
            'stigmergy.task',
            expect.objectContaining({
                subagent_type: '@qa'
            }),
            '@specifier'
        );
    });
});
