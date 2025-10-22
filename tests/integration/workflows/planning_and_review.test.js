import { spyOn, mock, test, expect, beforeEach, afterEach, describe } from "bun:test";
import path from "path";
import { Volume } from 'memfs';

// --- MOCKS MUST BE DEFINED BEFORE ANY APPLICATION IMPORTS ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

const mockFsExtra = {
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeFileSync: memfs.writeFileSync,
  existsSync: memfs.existsSync,
  promises: memfs.promises,
  default: null,
};
mockFsExtra.default = mockFsExtra;

// Mock fs-extra and NATIVE fs to ensure all file ops are in-memory
mock.module('fs-extra', () => mockFsExtra);
mock.module('fs', () => memfs);
mock.module('fs/promises', () => memfs.promises);

// --- APPLICATION IMPORTS NOW COME AFTER MOCKS ---
let Stigmergy;
let realCreateExecutor;
let GraphStateManager;


const executeMock = mock().mockResolvedValue(JSON.stringify({ success: true }));
const mockStreamText = mock();

let engine;
let projectRoot;

describe("Phase-Based E2E Test: Planning and Review Handoff", () => {
    beforeEach(async () => {
        vol.reset();
        mockStreamText.mockClear();
        executeMock.mockClear();

        Stigmergy = (await import("../../../engine/server.js")).Engine;
        realCreateExecutor = (await import("../../../engine/tool_executor.js")).createExecutor;

        projectRoot = path.resolve('/test-project-planning');
        const corePath = path.join(projectRoot, '.stigmergy-core');
        process.env.STIGMERGY_CORE_PATH = corePath;
        const agentDir = path.join(corePath, 'agents');
        mockFsExtra.ensureDirSync(agentDir);
        mockFsExtra.ensureDirSync(path.join(projectRoot, 'dashboard', 'public'));
        mockFsExtra.writeFileSync(path.join(projectRoot, 'dashboard', 'public', 'index.html'), '<html></html>');


        const createAgentFile = (name) => {
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
            mockFsExtra.writeFileSync(path.join(agentDir, `${name.toLowerCase()}.md`), content);
        };

        createAgentFile('Specifier');
        createAgentFile('QA');

        const testExecutorFactory = (engine, ai, options) => {
            const executor = realCreateExecutor(engine, ai, options);
            executor.execute = executeMock;
            return executor;
        };

        engine = new Stigmergy({
            _test_streamText: mockStreamText,
            _test_createExecutor: testExecutorFactory,
            _test_fs: mockFsExtra,
            projectRoot: projectRoot,
            corePath: corePath,
            startServer: false, // Prevent port conflicts
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
            'specifier'
        );
    });
});