import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Volume } from 'memfs';
import path from 'path';

// --- 1. Definitive, Robust Mock for fs and fs-extra ---
const vol = new Volume();
// Use require to handle CJS/ESM interop issues with memfs in Bun tests
const { createFsFromVolume } = require('memfs');
const memfs = createFsFromVolume(vol);

// fs-extra mock should be promise-based at the top level
const mockFsExtra = {
  ...memfs.promises,
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  writeJson: (file, obj, options) => memfs.promises.writeFile(file, JSON.stringify(obj, null, options?.spaces)),
  pathExists: (p) => Promise.resolve(memfs.existsSync(p)),
  pathExistsSync: memfs.existsSync,
  // For dependencies that might expect the whole object
  default: {
    ...memfs.promises,
    ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
    ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
    writeJson: (file, obj, options) => memfs.promises.writeFile(file, JSON.stringify(obj, null, options?.spaces)),
    pathExists: (p) => Promise.resolve(memfs.existsSync(p)),
    pathExistsSync: memfs.existsSync,
  }
};
mock.module('fs-extra', () => mockFsExtra);
// native fs mock is callback-based
mock.module('fs', () => memfs);


// --- 2. Mock for the Coderag Tool Module ---
const mockSemanticSearch = mock(async (params) => []);
const mockCalculateMetrics = mock(async (params) => ({}));
const mockFindArchitecturalIssues = mock(async (params) => []);
mock.module('../../../tools/coderag_tool.js', () => ({
  semantic_search: mockSemanticSearch,
  calculate_metrics: mockCalculateMetrics,
  find_architectural_issues: mockFindArchitecturalIssues,
}));

// --- 3. Mock other dependencies ---
mock.module('../../../services/config_service.js', () => ({
  configService: {
    getConfig: () => ({
      security: { allowedDirs: ["src", "public"], generatedPaths: ["dist"] },
    }),
  },
}));

// DEFINITIVE FIX #1: Mock the monitoring service to prevent secondary errors
mock.module('../../../services/model_monitoring.js', () => ({
    trackToolUsage: mock(async () => {})
}));


describe('Engine: Agent and Coderag Tool Integration', () => {
  let execute;
  const projectRoot = '/test-project';
  const corePath = path.join(projectRoot, '.stigmergy-core');

  beforeEach(async () => {
    vol.reset();
    mockSemanticSearch.mockClear();
    mockCalculateMetrics.mockClear();
    mockFindArchitecturalIssues.mockClear();

    process.env.STIGMERGY_CORE_PATH = corePath;

    // Use the mocked fs-extra, which is promise-based
    await mockFsExtra.ensureDir(path.join(corePath, 'agents'));

    const mockDebuggerAgentContent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools: ["coderag.*"]
\`\`\`
`;
    await mockFsExtra.writeFile(path.join(corePath, 'agents', 'debugger.md'), mockDebuggerAgentContent);

    const mockEngine = {
      broadcastEvent: mock(),
      projectRoot: projectRoot,
      _test_fs: mockFsExtra, // Pass the promise-based mock for path resolution
    };

    // Dynamically import here to ensure mocks are applied
    const toolExecutorModule = await import('../../../engine/tool_executor.js');
    const executorInstance = toolExecutorModule.createExecutor(mockEngine, {}, {});
    execute = executorInstance.execute;
  });

  afterEach(() => {
    delete process.env.STIGMERGY_CORE_PATH;
    mock.restore();
  });

  test('should call coderag.semantic_search', async () => {
    const fakeResults = [{ file: 'src/app.js', snippet: 'function main() {}' }];
    mockSemanticSearch.mockResolvedValue(fakeResults);

    const result = await execute('coderag.semantic_search', { query: 'main function' }, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeResults);
    expect(mockSemanticSearch).toHaveBeenCalledTimes(1);
    expect(mockSemanticSearch).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'main function', project_root: projectRoot })
    );
  });

  test('should call coderag.calculate_metrics', async () => {
    const fakeMetrics = { cyclomaticComplexity: 15, maintainability: 85 };
    mockCalculateMetrics.mockResolvedValue(fakeMetrics);

    const result = await execute('coderag.calculate_metrics', {}, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeMetrics);
    expect(mockCalculateMetrics).toHaveBeenCalledTimes(1);
  });

  test('should call coderag.find_architectural_issues', async () => {
    const fakeIssues = [{ type: 'Cyclic Dependency', files: ['a.js', 'b.js'] }];
    mockFindArchitecturalIssues.mockResolvedValue(fakeIssues);

    const result = await execute('coderag.find_architectural_issues', {}, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeIssues);
    expect(mockFindArchitecturalIssues).toHaveBeenCalledTimes(1);
  });
});