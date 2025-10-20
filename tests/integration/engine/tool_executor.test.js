import { mock, describe, test, expect, beforeEach, afterEach, afterAll } from 'bun:test';
import path from 'path';
import { Volume } from 'memfs';
import { OperationalError } from '../../../utils/errorHandler.js';

// --- START TOP-LEVEL MOCK SETUP ---

const vol = new Volume();
// THIS IS THE KEY: Use require() for createFsFromVolume
const memfs = require('memfs').createFsFromVolume(vol);

// Create a comprehensive mock that includes all necessary methods.
const mockFs = {
  ...memfs,
  promises: memfs.promises,
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  readFile: memfs.promises.readFile, // Needed for reading agent defs
  writeFile: memfs.promises.writeFile,
  appendFile: memfs.promises.appendFile,
  statSync: memfs.statSync,
  ensureDirSync: (p) => memfs.mkdirSync(p, { recursive: true }),
};

// Mock the fileSystem tool module to use our mock fs by default.
const fileSystemTools = await import('../../../tools/file_system.js');
const mockedFileSystem = {};
for (const key in fileSystemTools) {
  mockedFileSystem[key] = (args) => fileSystemTools[key](args, mockFs);
}
mock.module('../../../tools/file_system.js', () => mockedFileSystem);

// Mock fs-extra as well, since tool_executor uses it directly.
mock.module('fs-extra', () => ({ ...mockFs, default: mockFs }));


// Dynamically import the module under test AFTER mocks are set up.
const { createExecutor } = await import('../../../engine/tool_executor.js');

// --- END TOP-LEVEL MOCK SETUP ---

describe('Tool Executor: Guardian Protocol', () => {
  let mockEngine;
  let mockAiProvider;
  const projectRoot = '/test-project'; // Use a consistent mock root
  const corePath = path.join(projectRoot, '.stigmergy-core');
  const agentDir = path.join(corePath, 'agents');


  beforeEach(() => {
    vol.reset();
    mockFs.ensureDirSync(agentDir); // Ensure the directory exists in memfs

    // Create mock agent files within the isolated project root
    const createAgentFile = (name) => {
        const content = `\`\`\`yaml\nagent:\n  engine_tools:\n    - "file_system.*"\n\`\`\``;
        const filePath = path.join(agentDir, `${name}.md`);
        mockFs.writeFileSync(filePath, content);
    };

    createAgentFile('@guardian');
    createAgentFile('@executor');
    createAgentFile('@metis');

    // Create a dummy source file
    const srcDir = path.join(projectRoot, 'src');
    mockFs.ensureDirSync(srcDir);
    mockFs.writeFileSync(path.join(srcDir, 'some_file.txt'), 'hello');

    mockEngine = {
      broadcastEvent: mock(() => {}),
      projectRoot: projectRoot,
      corePath: corePath, // Pass corePath explicitly
      _test_fs: mockFs,
    };

    mockAiProvider = {
      getModelForTier: mock(() => 'mock-model'),
    };
  });

  afterEach(() => {
    mock.restore();
  });

  test('should throw OperationalError when a non-guardian agent writes to .stigmergy-core', async () => {
    const { execute } = createExecutor(mockEngine, mockAiProvider);
    const unauthorizedAgentId = '@executor';
    const toolName = 'file_system.writeFile';
    const args = {
      path: '.stigmergy-core/some_config.yml',
      content: 'new config',
    };

    const promise = execute(toolName, args, unauthorizedAgentId);

    await expect(promise).rejects.toThrow(OperationalError);
    await expect(promise).rejects.toThrow(
      "Security Violation: Only the @guardian or @metis agents may modify core system files. Agent '@executor' is not authorized."
    );
  });

  test('should allow @guardian agent to write to .stigmergy-core', async () => {
    const { execute } = createExecutor(mockEngine, mockAiProvider);
    const authorizedAgentId = '@guardian';
    const toolName = 'file_system.writeFile';
    const filePath = path.join(cwd, '.stigmergy-core/some_config.yml');
    const args = {
      path: '.stigmergy-core/some_config.yml',
      content: 'guardian was here',
    };

    await execute(toolName, args, authorizedAgentId);

    const fileContent = vol.readFileSync(filePath, 'utf8');
    expect(fileContent).toBe('guardian was here');
  });

  test('should allow @metis agent to write to .stigmergy-core', async () => {
    const { execute } = createExecutor(mockEngine, mockAiProvider);
    const authorizedAgentId = '@metis';
    const toolName = 'file_system.writeFile';
    const filePath = path.join(cwd, '.stigmergy-core/some_config.yml');
    const args = {
      path: '.stigmergy-core/some_config.yml',
      content: 'metis was here',
    };

    await execute(toolName, args, authorizedAgentId);
    
    const fileContent = vol.readFileSync(filePath, 'utf8');
    expect(fileContent).toBe('metis was here');
  });

  test('should allow any agent to write to a non-core file', async () => {
    const { execute } = createExecutor(mockEngine, mockAiProvider);
    const agentId = '@executor';
    const toolName = 'file_system.writeFile';
    const filePath = path.join(cwd, 'src/another_file.txt');
    const args = {
      path: 'src/another_file.txt',
      content: 'executor was here',
    };

    await execute(toolName, args, agentId);

    const fileContent = vol.readFileSync(filePath, 'utf8');
    expect(fileContent).toBe('executor was here');
  });
});