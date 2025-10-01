import { test, describe, expect, spyOn, mock, beforeEach, afterEach } from 'bun:test';
import { Volume } from 'memfs';
import path from 'path';
import { createExecutor } from '../../../engine/tool_executor.js';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';

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
  existsSync: memfs.existsSync, // The missing function
  promises: memfs.promises,
};
mockFs.default = mockFs;

// --- 2. Mock the fs-extra module for the entire test file ---
mock.module('fs-extra', () => mockFs);

describe('Engine: Agent and Tools Integration', () => {
  let executor;
  let findUsagesSpy, getDefinitionSpy, getModuleDependenciesSpy, runQuerySpy;

  beforeEach(() => {
    vol.reset(); // Clear the in-memory file system

    // --- 3. Create mock agent files in-memory ---
    const agentDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    mockFs.ensureDirSync(agentDir);
    const mockDebuggerAgent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools:
    - "file_system.*"
    - "code_intelligence.*"
\`\`\`
`;
    mockFs.writeFileSync(path.join(agentDir, 'debugger.md'), mockDebuggerAgent);


    // Spy on the actual methods of the real service
    findUsagesSpy = spyOn(CodeIntelligenceService.prototype, 'findUsages');
    getDefinitionSpy = spyOn(CodeIntelligenceService.prototype, 'getDefinition');
    getModuleDependenciesSpy = spyOn(CodeIntelligenceService.prototype, 'getModuleDependencies');
    runQuerySpy = spyOn(CodeIntelligenceService.prototype, '_runQuery');

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

  test('should call code_intelligence.findUsages', async () => {
    const fakeUsages = [{ filePath: 'src/some/file.js', line: 10, code: 'const mySymbol = 42;' }];
    findUsagesSpy.mockResolvedValue(fakeUsages);

    const result = JSON.parse(await executor.execute('code_intelligence.findUsages', { symbolName: 'mySymbol' }, 'debugger'));

    expect(result).toEqual(fakeUsages);
    expect(findUsagesSpy).toHaveBeenCalledTimes(1);
  });

  test('should call code_intelligence.getDefinition', async () => {
    const fakeDefinition = { filePath: 'src/some/file.js', line: 5, definition: 'function mySymbol() {}' };
    getDefinitionSpy.mockResolvedValue(fakeDefinition);

    const result = JSON.parse(await executor.execute('code_intelligence.getDefinition', { symbolName: 'mySymbol' }, 'debugger'));

    expect(result).toEqual(fakeDefinition);
    expect(getDefinitionSpy).toHaveBeenCalledTimes(1);
  });

  test('should call code_intelligence.getModuleDependencies', async () => {
    const fakeDeps = ['path/to/dep1.js', 'path/to/dep2.js'];
    getModuleDependenciesSpy.mockResolvedValue(fakeDeps);

    const result = JSON.parse(await executor.execute('code_intelligence.getModuleDependencies', { filePath: 'src/app.js' }, 'debugger'));

    expect(result).toEqual(fakeDeps);
    expect(getModuleDependenciesSpy).toHaveBeenCalledTimes(1);
  });

  test('should call code_intelligence.getFullCodebaseContext', async () => {
    // Mock the neo4j record's .get() method more accurately.
    const fakeQueryResults = [
      { get: (key) => ({ file: 'src/app.js', members: [{ properties: { name: 'start', type: 'Function' } }] }[key]) },
      { get: (key) => ({ file: 'src/utils.js', members: [] }[key]) }
    ];
    runQuerySpy.mockResolvedValue(fakeQueryResults);

    const result = JSON.parse(await executor.execute('code_intelligence.getFullCodebaseContext', {}, 'debugger'));

    const expectedSummary = "Current Codebase Structure:\n\n- File: src/app.js\n  - Function: start\n- File: src/utils.js\n  (No defined classes or functions found)\n";
    expect(result).toEqual(expectedSummary);
    expect(runQuerySpy).toHaveBeenCalledTimes(1);
  });
});