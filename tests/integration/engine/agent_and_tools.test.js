import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs-extra';
import { createExecutor } from '../../../engine/tool_executor.js';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';

describe('Engine: Agent and Tools Integration', () => {
  let executor;
  let fsReadFileStub;
  let findUsagesStub, getDefinitionStub, getModuleDependenciesStub, runQueryStub;

  beforeEach(() => {
    // Stub individual methods on the prototype to ensure they exist for testing
    findUsagesStub = sinon.stub(CodeIntelligenceService.prototype, 'findUsages');
    getDefinitionStub = sinon.stub(CodeIntelligenceService.prototype, 'getDefinition');
    getModuleDependenciesStub = sinon.stub(CodeIntelligenceService.prototype, 'getModuleDependencies');
    runQueryStub = sinon.stub(CodeIntelligenceService.prototype, '_runQuery');

    // Stub fs.readFile to provide a mock agent definition
    fsReadFileStub = sinon.stub(fs, 'readFile');
    const mockDebuggerAgent = `
\`\`\`yaml
agent:
  id: "debugger"
  engine_tools:
    - "file_system.*"
    - "code_intelligence.*"
\`\`\`
`;
    fsReadFileStub.withArgs(sinon.match(/debugger\.md$/)).resolves(mockDebuggerAgent);
    fsReadFileStub.callThrough();

    const mockEngine = {
      broadcastEvent: sinon.stub(),
      projectRoot: '/app',
      getAgent: sinon.stub(),
      triggerAgent: sinon.stub(),
    };
    const mockAi = {};
    const mockConfig = {};

    executor = createExecutor(mockEngine, mockAi, mockConfig);
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  it('should call code_intelligence.findUsages', async () => {
    const fakeUsages = [{ filePath: 'src/some/file.js', line: 10, code: 'const mySymbol = 42;' }];
    findUsagesStub.resolves(fakeUsages);

    const result = JSON.parse(await executor.execute('code_intelligence.findUsages', { symbolName: 'mySymbol' }, 'debugger'));

    expect(result).to.deep.equal(fakeUsages);
    sinon.assert.calledOnce(findUsagesStub);
  });

  it('should call code_intelligence.getDefinition', async () => {
    const fakeDefinition = { filePath: 'src/some/file.js', line: 5, definition: 'function mySymbol() {}' };
    getDefinitionStub.resolves(fakeDefinition);

    const result = JSON.parse(await executor.execute('code_intelligence.getDefinition', { symbolName: 'mySymbol' }, 'debugger'));

    expect(result).to.deep.equal(fakeDefinition);
    sinon.assert.calledOnce(getDefinitionStub);
  });

  it('should call code_intelligence.getModuleDependencies', async () => {
    const fakeDeps = ['path/to/dep1.js', 'path/to/dep2.js'];
    getModuleDependenciesStub.resolves(fakeDeps);

    const result = JSON.parse(await executor.execute('code_intelligence.getModuleDependencies', { filePath: 'src/app.js' }, 'debugger'));

    expect(result).to.deep.equal(fakeDeps);
    sinon.assert.calledOnce(getModuleDependenciesStub);
  });

  it('should call code_intelligence.getFullCodebaseContext', async () => {
    const fakeQueryResults = [
        { file: 'src/app.js', members: [{ name: 'start', type: 'Function' }] },
        { file: 'src/utils.js', members: [] }
    ];
    runQueryStub.resolves(fakeQueryResults);

    const result = JSON.parse(await executor.execute('code_intelligence.getFullCodebaseContext', {}, 'debugger'));

    const expectedSummary = "Current Codebase Structure:\n\n- File: src/app.js\n  - Function: start\n- File: src/utils.js\n  (No defined classes or functions found)\n";
    expect(result).to.equal(expectedSummary);
    sinon.assert.calledOnce(runQueryStub);
  });
});