import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import { OperationalError } from '../../../utils/errorHandler.js';
import mockFs, { vol } from '../../mocks/fs.js';
import { GraphStateManager } from '../../../src/infrastructure/state/GraphStateManager.js';
import { Engine } from '../../../engine/server.js';
import { createExecutor } from '../../../engine/tool_executor.js';

describe('Tool Executor Path Resolution and Security', () => {
    let mockEngine;
    let execute;
    const projectRoot = '/test-project-security';

    beforeEach(async () => {
        vol.reset(); // PRISTINE STATE: Reset filesystem

        // Mock modules for isolation
        mock.module('fs', () => mockFs);
        mock.module('fs-extra', () => mockFs);
        // Mocks for services called by the Engine
        mock.module('../../../services/config_service.js', () => ({
            configService: {
                getConfig: () => ({
                    security: {
                        allowedDirs: ["src", "public"],
                        generatedPaths: ["dist"],
                    },
                    model_tiers: { reasoning_tier: { provider: 'mock', model_name: 'mock-model' } },
                    providers: { mock_provider: { api_key: 'mock-key' } }
                }),
            },
        }));
        mock.module('../../../services/trajectory_recorder.js', () => ({ default: { startRecording: mock(), logEvent: mock(), finalizeRecording: mock() } }));
        mock.module('../../../services/model_monitoring.js', () => ({ trackToolUsage: mock(), appendLog: mock() }));

        // Setup mock project structure in the pristine filesystem
        process.env.STIGMERGY_CORE_PATH = path.join(projectRoot, '.stigmergy-core');
        const agentDir = path.join(process.env.STIGMERGY_CORE_PATH, 'agents');
        await mockFs.promises.mkdir(agentDir, { recursive: true });
        await mockFs.promises.mkdir(path.join(projectRoot, 'src'), { recursive: true });
        await mockFs.promises.mkdir(path.join(projectRoot, 'dist'), { recursive: true });

        const testAgentContent = `
\`\`\`yaml
agent:
  id: "@test-agent"
  engine_tools: ["file_system.*"]
\`\`\`
`;
        await mockFs.promises.writeFile(path.join(agentDir, '@test-agent.md'), testAgentContent);

        const guardianAgentContent = `
\`\`\`yaml
agent:
  id: "@guardian"
  engine_tools: ["file_system.*"]
\`\`\`
`;
        await mockFs.promises.writeFile(path.join(agentDir, '@guardian.md'), guardianAgentContent);

        // PRISTINE STATE: Create a new Engine for each test
        const stateManager = new GraphStateManager(projectRoot); // Each test gets a new state manager
        const mockUnifiedIntelligenceService = {}; // An empty mock is sufficient as this test focuses on path security, not Coderag tools.

        mockEngine = new Engine({
            projectRoot,
            stateManager,
            startServer: false,
            _test_fs: mockFs,
            _test_unifiedIntelligenceService: mockUnifiedIntelligenceService, // Inject mock
        });

        // DEFINITIVE FIX: Align the test's executor creation with the new dependency-injected signature.
        // The executor now requires the engine's config and the intelligence service to be passed in its options.
        const executorInstance = await createExecutor(
            mockEngine,
            {}, // mock ai
            { config: mockEngine.config, unifiedIntelligenceService: mockEngine.unifiedIntelligenceService },
            mockFs
        );
        execute = executorInstance.execute;
    });

    afterEach(async () => {
        if (mockEngine) {
            await mockEngine.stop(); // PRISTINE STATE: Stop the engine
        }
        mock.restore(); // PRISTINE STATE: Restore mocks
        delete process.env.STIGMERGY_CORE_PATH;
    });

    test('should allow writing to a safe directory', async () => {
        const filePath = 'src/allowed.js';
        await execute('file_system.writeFile', { path: filePath, content: 'safe' }, '@test-agent');
        const content = await mockFs.promises.readFile(path.join(projectRoot, filePath), 'utf-8');
        expect(content).toBe('safe');
    });

    test('should prevent writing to an unsafe directory', async () => {
        const promise = execute('file_system.writeFile', { path: 'unsafe/file.js', content: 'unsafe' }, '@test-agent');
        await expect(promise).rejects.toThrow(/Access restricted to unsafe directory/);
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
         const content = await mockFs.promises.readFile(path.join(projectRoot, coreFilePath), 'utf-8');
         expect(content).toBe('core-setting');
    });

    test('should prevent non-@guardian agents from writing to core files', async () => {
        const coreFilePath = '.stigmergy-core/some-config.yml';
        const promise = execute('file_system.writeFile', { path: coreFilePath, content: 'core-setting' }, '@test-agent');
        await expect(promise).rejects.toThrow(/Only the @guardian or @metis agents may modify core system files/);
    });
});
