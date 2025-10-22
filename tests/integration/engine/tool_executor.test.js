import { test, describe, expect, mock, beforeAll, afterAll, beforeEach, afterEach } from 'bun:test';
// Do NOT import Engine or createExecutor statically
import { getTestStateManager } from '../../global_state.js';
import { Volume } from 'memfs';
import path from 'path';
import { OperationalError } from '../../../utils/errorHandler.js';

// --- Definitive FS Mock ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);
const mockFs = { ...memfs };
mockFs.promises = memfs.promises;
mock.module('fs', () => mockFs);
mock.module('fs-extra', () => mockFs);

// --- Other Mocks ---
const mockConfigService = {
  getConfig: () => ({
    security: {
      allowedDirs: ["src", "public"],
      generatedPaths: ["dist"],
    },
  }),
};
mock.module('../../../services/config_service.js', () => ({ configService: mockConfigService }));

mock.module('../../../services/trajectory_recorder.js', () => ({
    default: {
        startRecording: mock(() => 'mock-id'),
        logEvent: mock(() => {}),
        finalizeRecording: mock(async () => {}),
    }
}));


describe('Tool Executor Path Resolution and Security', () => {
    let mockEngine;
    let execute;
    let Engine, createExecutor; // To be populated by dynamic import
    const projectRoot = '/test-project-security';

    beforeAll(async () => {
        await memfs.promises.mkdir(projectRoot, { recursive: true });
        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        await memfs.promises.mkdir(process.env.STIGMERGY_CORE_PATH, { recursive: true });
    });

    afterAll(async () => {
        await memfs.promises.rm(projectRoot, { recursive: true, force: true });
        delete process.env.STIGMERGY_CORE_PATH;
    });

    beforeEach(async () => {
        // DEFINITIVE FIX: Dynamically import modules AFTER mocks are set up.
        Engine = (await import('../../../engine/server.js')).Engine;
        createExecutor = (await import('../../../engine/tool_executor.js')).createExecutor;

        vol.reset();
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await memfs.promises.mkdir(agentDir, { recursive: true });
        await memfs.promises.mkdir(path.join(projectRoot, 'src'), { recursive: true });
        await memfs.promises.mkdir(path.join(projectRoot, 'dist'), { recursive: true });

        const testAgentContent = `
agent:
  id: "@test-agent"
  engine_tools: ["file_system.*"]
`;
        await memfs.promises.writeFile(path.join(agentDir, '@test-agent.md'), testAgentContent);

        const guardianAgentContent = `
agent:
  id: "@guardian"
  engine_tools: ["file_system.*"]
`;
        await memfs.promises.writeFile(path.join(agentDir, '@guardian.md'), guardianAgentContent);

        const stateManager = getTestStateManager();
        mockEngine = new Engine({
            projectRoot,
            stateManager,
            startServer: false,
            _test_fs: memfs,
        });

        const executorInstance = createExecutor(mockEngine, {}, {});
        execute = executorInstance.execute;
    });

    afterEach(async () => {
        if (mockEngine) {
            await mockEngine.stop();
        }
        mock.restore();
    });

    test('should allow writing to a safe directory', async () => {
        const filePath = 'src/allowed.js';
        await execute('file_system.writeFile', { path: filePath, content: 'safe' }, '@test-agent');
        const content = await memfs.promises.readFile(path.join(projectRoot, filePath), 'utf-8');
        expect(content).toBe('safe');
    });

    test('should prevent writing to an unsafe directory', async () => {
        const promise = execute('file_system.writeFile', { path: 'unsafe/file.js', content: 'unsafe' }, '@test-agent');
        await expect(promise).rejects.toThrow(new OperationalError('Access restricted to unsafe directory'));
    });

    test('should prevent path traversal', async () => {
        const promise = execute('file_system.writeFile', { path: '../traversal.js', content: 'unsafe' }, '@test-agent');
        await expect(promise).rejects.toThrow(/Security violation: Path traversal attempt/);
    });

    test('should prevent writing to a generated code path', async () => {
        const promise = execute('file_system.writeFile', { path: 'dist/bundle.js', content: 'generated' }, '@test-agent');
        await expect(promise).rejects.toThrow(/is inside a protected 'generated' directory/);
    });

    test('should allow @guardian to write to core files', async () => {
         const coreFilePath = '.stigmergy-core/some-config.yml';
         await execute('file_system.writeFile', { path: coreFilePath, content: 'core-setting' }, '@guardian');
         const content = await memfs.promises.readFile(path.join(projectRoot, coreFilePath), 'utf-8');
         expect(content).toBe('core-setting');
    });

    test('should prevent non-@guardian agents from writing to core files', async () => {
        const coreFilePath = '.stigmergy-core/some-config.yml';
        const promise = execute('file_system.writeFile', { path: coreFilePath, content: 'core-setting' }, '@test-agent');
        await expect(promise).rejects.toThrow(/Only the @guardian or @metis agents may modify core system files/);
    });
});