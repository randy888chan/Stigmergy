import { test, describe, expect, spyOn, mock, beforeEach, afterEach } from 'bun:test';
import { Volume } from 'memfs';
import path from 'path';
import { createExecutor } from '../../../engine/tool_executor.js';
import { unifiedIntelligenceService } from '../../../services/unified_intelligence.js';

// --- 1. Setup In-Memory File System & Mock ---
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);
const mockFs = {
  // Add all necessary methods that might be called by the executor or services.
  readFile: memfs.promises.readFile,
  writeFile: memfs.promises.writeFile,
  appendFile: memfs.promises.appendFile,
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
  statSync: memfs.statSync,
  mkdirSync: memfs.mkdirSync,
  writeFileSync: memfs.writeFileSync,
  existsSync: memfs.existsSync,
  promises: memfs.promises,
};
mockFs.default = mockFs;

// --- 2. Mock the fs-extra module for the entire test file ---
mock.module('fs-extra', () => mockFs);

// --- 3. Mock the context to prevent the singleton from throwing errors ---
mock.module('../../../engine/context.js', () => ({
  getContext: () => ({ project_root: process.cwd() }),
}));


describe('Engine: Agent and Coderag Tool Integration', () => {
  let executor;
  let semanticSearchSpy, calculateMetricsSpy, findArchitecturalIssuesSpy;

  beforeEach(() => {
    vol.reset(); // Clear the in-memory file system

    // --- Create mock agent & trajectory directories in-memory ---
    const agentDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    const trajectoryDir = path.join(process.cwd(), '.stigmergy', 'trajectories');
    mockFs.ensureDirSync(agentDir);
    mockFs.ensureDirSync(trajectoryDir);

    const mockDebuggerAgent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools:
    - "file_system.*"
    - "coderag.*"
\`\`\`
`;
    mockFs.writeFileSync(path.join(agentDir, 'debugger.md'), mockDebuggerAgent);

    // Spy on the methods of the unifiedIntelligenceService singleton
    semanticSearchSpy = spyOn(unifiedIntelligenceService, 'semanticSearch').mockImplementation(async () => {});
    calculateMetricsSpy = spyOn(unifiedIntelligenceService, 'calculateMetrics').mockImplementation(async () => {});
    findArchitecturalIssuesSpy = spyOn(unifiedIntelligenceService, 'findArchitecturalIssues').mockImplementation(async () => {});

    const mockEngine = {
      broadcastEvent: mock(),
      projectRoot: process.cwd(),
      getAgent: mock(),
      triggerAgent: mock(),
    };
    const mockAi = {};
    const mockConfig = {};

    executor = createExecutor(mockEngine, mockAi, mockConfig);
  });

  afterEach(() => {
    mock.restore();
  });

  test('should call coderag.semantic_search', async () => {
    const fakeResults = [{ file: 'src/app.js', snippet: 'function main() {}' }];
    semanticSearchSpy.mockResolvedValue(fakeResults);

    const result = await executor.execute('coderag.semantic_search', { query: 'main function' }, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeResults);
    expect(semanticSearchSpy).toHaveBeenCalledTimes(1);
    expect(semanticSearchSpy).toHaveBeenCalledWith('main function');
  });

  test('should call coderag.calculate_metrics', async () => {
    const fakeMetrics = { cyclomaticComplexity: 15, maintainability: 85 };
    calculateMetricsSpy.mockResolvedValue(`Metrics calculation complete: ${JSON.stringify(fakeMetrics)}`);

    const result = await executor.execute('coderag.calculate_metrics', {}, 'debugger');

    expect(JSON.parse(result)).toContain('{"cyclomaticComplexity":15,"maintainability":85}');
    expect(calculateMetricsSpy).toHaveBeenCalledTimes(1);
  });

  test('should call coderag.find_architectural_issues', async () => {
    const fakeIssues = [{ type: 'Cyclic Dependency', files: ['a.js', 'b.js'] }];
    findArchitecturalIssuesSpy.mockResolvedValue(fakeIssues);

    const result = await executor.execute('coderag.find_architectural_issues', {}, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeIssues);
    expect(findArchitecturalIssuesSpy).toHaveBeenCalledTimes(1);
  });
});