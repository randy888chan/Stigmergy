import { test, describe, expect, mock, beforeEach, afterEach } from 'bun:test';
import { Volume } from 'memfs';
import path from 'path';

// --- Mock the entire coderag tool module ---
const mockCoderagTool = {
  semantic_search: mock(async ({ query, project_root }) => []),
  calculate_metrics: mock(async () => '{"metrics": "mocked"}'),
  find_architectural_issues: mock(async () => []),
};
mock.module('../../../tools/coderag_tool.js', () => mockCoderagTool);

import { createExecutor } from '../../../engine/tool_executor.js';

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

  beforeEach(() => {
    vol.reset(); // Clear the in-memory file system
    mockCoderagTool.semantic_search.mockClear();
    mockCoderagTool.calculate_metrics.mockClear();
    mockCoderagTool.find_architectural_issues.mockClear();

    // Use a consistent mock project root for isolation
    const projectRoot = '/test-project';
    const corePath = path.join(projectRoot, '.stigmergy-core');
    const agentDir = path.join(corePath, 'agents');
    mockFs.ensureDirSync(agentDir);

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

    const mockEngine = {
      broadcastEvent: mock(),
      projectRoot: projectRoot,
      corePath: corePath, // Be explicit about the core path
      getAgent: mock(),
      triggerAgent: mock(),
      stop: mock(async () => {}),
    };

    executor = createExecutor(mockEngine, {}, {});
  });

  afterEach(async () => {
    if (executor && executor.engine && typeof executor.engine.stop === 'function') {
      await executor.engine.stop();
    }
    mock.restore();
  });

  test('should call coderag.semantic_search', async () => {
    const fakeResults = [{ file: 'src/app.js', snippet: 'function main() {}' }];
    mockCoderagTool.semantic_search.mockResolvedValue(fakeResults);

    const result = await executor.execute('coderag.semantic_search', { query: 'main function' }, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeResults);
    expect(mockCoderagTool.semantic_search).toHaveBeenCalledTimes(1);
    expect(mockCoderagTool.semantic_search).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'main function' })
    );
  });

  test('should call coderag.calculate_metrics', async () => {
    const fakeMetrics = { cyclomaticComplexity: 15, maintainability: 85 };
    // The mock now directly returns the stringified JSON the tool is expected to return
    mockCoderagTool.calculate_metrics.mockResolvedValue(`Metrics calculation complete: ${JSON.stringify(fakeMetrics)}`);

    const result = await executor.execute('coderag.calculate_metrics', {}, 'debugger');

    const toolOutput = JSON.parse(result);
    expect(toolOutput).toContain('{"cyclomaticComplexity":15,"maintainability":85}');
    expect(mockCoderagTool.calculate_metrics).toHaveBeenCalledTimes(1);
  });

  test('should call coderag.find_architectural_issues', async () => {
    const fakeIssues = [{ type: 'Cyclic Dependency', files: ['a.js', 'b.js'] }];
    mockCoderagTool.find_architectural_issues.mockResolvedValue(fakeIssues);

    const result = await executor.execute('coderag.find_architectural_issues', {}, 'debugger');

    expect(JSON.parse(result)).toEqual(fakeIssues);
    expect(mockCoderagTool.find_architectural_issues).toHaveBeenCalledTimes(1);
  });
});