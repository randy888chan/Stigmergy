import { test, describe, expect, spyOn, mock, beforeEach, afterEach } from 'bun:test';
import fs from 'fs-extra';
import { createExecutor } from '../../../engine/tool_executor.js';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';

describe('Engine: Agent and Tools Integration', () => {
  let executor;
  let findUsagesSpy, getDefinitionSpy, getModuleDependenciesSpy, runQuerySpy;

  beforeEach(() => {
    // Spy on individual methods on the prototype
    findUsagesSpy = spyOn(CodeIntelligenceService.prototype, 'findUsages');
    getDefinitionSpy = spyOn(CodeIntelligenceService.prototype, 'getDefinition');
    getModuleDependenciesSpy = spyOn(CodeIntelligenceService.prototype, 'getModuleDependencies');
    runQuerySpy = spyOn(CodeIntelligenceService.prototype, '_runQuery');

    // Spy on fs.readFile to provide a mock agent definition
    const mockDebuggerAgent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools:
    - "file_system.*"
    - "code_intelligence.*"
\`\`\`
`;
    // Use a spy to conditionally mock readFile
    const originalReadFile = fs.readFile;
    spyOn(fs, 'readFile').mockImplementation(async (path, ...args) => {
        if (typeof path === 'string' && /debugger\.md$/.test(path)) {
            return mockDebuggerAgent;
        }
        // Ensure the original function is called for other paths
        return originalReadFile(path, ...args);
    });

    const mockEngine = {
      broadcastEvent: mock(),
      projectRoot: '/app',
      getAgent: mock(),
      triggerAgent: mock(),
    };
    const mockAi = {};
    const mockConfig = {};

    executor = createExecutor(mockEngine, mockAi, mockConfig);
  });

  afterEach(() => {
    // Restore all mocks and spies
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
    const fakeQueryResults = [
        { file: 'src/app.js', members: [{ name: 'start', type: 'Function' }] },
        { file: 'src/utils.js', members: [] }
    ];
    runQuerySpy.mockResolvedValue(fakeQueryResults);

    const result = JSON.parse(await executor.execute('code_intelligence.getFullCodebaseContext', {}, 'debugger'));

    const expectedSummary = "Current Codebase Structure:\n\n- File: src/app.js\n  - Function: start\n- File: src/utils.js\n  (No defined classes or functions found)\n";
    expect(result).toEqual(expectedSummary);
    expect(runQuerySpy).toHaveBeenCalledTimes(1);
  });
});