import { mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';
import { Engine } from "../../../engine/server.js";
import { createExecutor as realCreateExecutor } from '../../../engine/tool_executor.js';

const executeMock = mock();
const mockStreamText = mock();
let engine;

describe("Research Workflow", () => {
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
                    model_tiers: { reasoning_tier: { provider: 'mock_provider', model_name: 'mock-model' } },
                    providers: { mock_provider: { api_key: 'mock-key' } }
                }),
            },
        }));

        const projectRoot = path.join(process.cwd(), 'test-project-research');
        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.ensureDir(agentDir);

        const analystAgentContent = `
    \`\`\`yaml
    agent:
      id: "analyst"
      engine_tools: ["research.*"]
    \`\`\`
    `;
        await mockFs.promises.writeFile(path.join(agentDir, 'analyst.md'), analystAgentContent);

        const mockUnifiedIntelligenceService = {};
        const testExecutorFactory = async (engine, ai, options) => {
            const finalOptions = { ...options, unifiedIntelligenceService: mockUnifiedIntelligenceService };
            const executor = await realCreateExecutor(engine, ai, finalOptions, mockFs);
            executor.execute = executeMock;
            return executor;
        };

        const stateManager = new GraphStateManager(projectRoot);
        engine = new Engine({
            projectRoot,
            stateManager,
            startServer: false,
            _test_fs: mockFs,
            _test_streamText: mockStreamText,
            _test_unifiedIntelligenceService: mockUnifiedIntelligenceService,
            _test_executorFactory: testExecutorFactory,
        });
    });

    afterEach(async () => {
        if (engine) {
            await engine.stop();
        }
        mock.restore();
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test("triggers deep_dive, evaluate_sources, and reports with confidence", async () => {
        const researchTopic = "What is the impact of AI on software development?";

        mockStreamText
            .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '1', toolName: 'research.deep_dive', args: { query: 'impact of AI on SWE' } }], finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '2', toolName: 'research.deep_dive', args: { query: 'AI in software testing' } }], finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ toolCalls: [{ toolCallId: '3', toolName: 'research.evaluate_sources', args: { urls: ['http://a.com', 'http://b.com'] } }], finishReason: 'tool-calls' })
            .mockResolvedValueOnce({ text: "Final Report...\n\n**Confidence Score:** High...", finishReason: 'stop' });

        executeMock.mockImplementation(async (toolName, args) => {
            if (toolName === 'research.deep_dive') {
                return JSON.stringify({ new_learnings: `Learnings from ${args.query}`, sources: ['http://a.com', 'http://b.com'] });
            }
            if (toolName === 'research.evaluate_sources') {
                return JSON.stringify([{ url: 'http://a.com', credibility_score: 9, justification: 'Good.' }]);
            }
            return JSON.stringify({});
        });

        await engine.triggerAgent("@analyst", researchTopic);

        const deepDiveCalls = executeMock.mock.calls.filter(call => call[0] === 'research.deep_dive');
        expect(deepDiveCalls.length).toBe(2);

        const evaluateSourcesCalls = executeMock.mock.calls.filter(call => call[0] === 'research.evaluate_sources');
        expect(evaluateSourcesCalls.length).toBe(1);

        expect(mockStreamText).toHaveBeenCalledTimes(4);
    });
});
