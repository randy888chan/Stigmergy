import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';

let Engine;
const mockStreamText = mock();

describe("Phase-Based E2E Test: Planning and Review Handoff", () => {
    let engine;
    let projectRoot;

    beforeEach(async () => {
        vol.reset();
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

        Engine = (await import("../../../engine/server.js")).Engine;

        // Corrected Pathing: .stigmergy-core MUST be inside the project root for the engine to find it.
        projectRoot = '/app/test-project-planning';
        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.ensureDir(agentDir);

        const createAgentFile = async (name, tools) => {
            const content = `
\`\`\`yaml
agent:
  id: "@${name.toLowerCase()}"
  name: ${name}
  engine_tools: [${tools.join(', ')}]
\`\`\`
`;
            await mockFs.promises.writeFile(path.join(agentDir, `${name.toLowerCase()}.md`), content);
        };

        await createAgentFile('specifier', ['"stigmergy.task"']);
        await createAgentFile('qa', []);

        const stateManager = new GraphStateManager(projectRoot);
        engine = new Engine({
            projectRoot,
            corePath: process.env.STIGMERGY_CORE_PATH,
            stateManager,
            startServer: false,
            _test_streamText: mockStreamText,
            _test_fs: mockFs,
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

        const specifierToolCall = {
            toolCalls: [{
                toolCallId: '1',
                toolName: 'stigmergy.task',
                args: { subagent_type: '@qa', description: 'Please review the generated plan.' }
            }],
            finishReason: 'tool-calls'
        };
        const specifierFinalResponse = { text: 'Delegating to QA for review.', finishReason: 'stop' };

        // Mock the QA agent's response as well, even though we are spying on the trigger
        const qaFinalResponse = { text: 'Plan looks good.', finishReason: 'stop' };

        mockStreamText
            .mockResolvedValueOnce(specifierToolCall)
            .mockResolvedValueOnce(specifierFinalResponse)
            .mockResolvedValueOnce(qaFinalResponse);

        await engine.triggerAgent('@specifier', goal);

        // The mockStreamText is called multiple times, the last one being the QA agent.
        // This is a robust way to verify the delegation happened.
        expect(mockStreamText).toHaveBeenCalledTimes(3);
    });
});
