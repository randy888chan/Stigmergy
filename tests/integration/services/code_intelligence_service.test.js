import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import { Volume } from 'memfs';

// --- 1. Setup In-Memory File System ---
// This creates a virtual file system, so our tests don't touch the real disk.
const vol = new Volume();
const memfs = require('memfs').createFsFromVolume(vol);

// 2. Create a comprehensive mock that mimics the 'fs-extra' API.
// The CodeIntelligenceService uses these methods internally.
const mockFs = {
  remove: (p) => memfs.promises.rm(p, { recursive: true, force: true }),
  ensureDir: (p) => memfs.promises.mkdir(p, { recursive: true }),
  writeFile: memfs.promises.writeFile,
  readFile: memfs.promises.readFile,
  stat: memfs.promises.stat,
  readdir: memfs.promises.readdir,
  readJson: async (file, options) => {
    const data = await memfs.promises.readFile(file, options);
    return JSON.parse(data.toString());
  },
  pathExists: async (pathStr) => {
    try {
      await memfs.promises.access(pathStr);
      return true;
    } catch {
      return false;
    }
  },
  promises: memfs.promises,
};
mockFs.default = mockFs;

// --- 3. Mock fs-extra for the entire test file ---
// Any code in this file (or imported by it) that calls `import fs from 'fs-extra'`
// will get our mockFs object instead. This is the crucial step.
mock.module('fs-extra', () => mockFs);


// --- 4. Mock neo4j-driver components ---
const mockTxRun = mock(() => Promise.resolve());
const mockTxCommit = mock(() => Promise.resolve());
const mockTxRollback = mock(() => Promise.resolve());
const mockTransaction = { run: mockTxRun, commit: mockTxCommit, rollback: mockTxRollback };
const mockVerifyConnectivity = mock(() => Promise.resolve());
const mockSessionRun = mock(() => Promise.resolve({ records: [{ get: () => ['5.17.0'] }] }));
const mockSessionClose = mock(() => Promise.resolve());
const mockSession = mock(() => ({
  run: mockSessionRun,
  close: mockSessionClose,
  beginTransaction: mock(() => mockTransaction),
}));
const mockDriverClose = mock(() => Promise.resolve());
const mockDriver = {
  verifyConnectivity: mockVerifyConnectivity,
  session: mockSession,
  close: mockDriverClose,
};
const mockDriverFunction = mock(() => mockDriver);


describe('CodeIntelligenceService Integration', () => {
  const originalEnv = process.env;
  let service;
  let mockConfig;
  let CodeIntelligenceService;
  let mockNeo4jModule;
  const fixturePath = path.join(process.cwd(), 'temp-test-project-knowledge-graph');

  beforeEach(async () => {
    // 5. Dynamically import the service AFTER all mocks are set up.
    const module = await import('../../../services/code_intelligence_service.js');
    CodeIntelligenceService = module.CodeIntelligenceService;

    // Reset all mocks to ensure test isolation.
    Object.values(mockTransaction).forEach(m => m.mockClear());
    mockVerifyConnectivity.mockClear();
    mockSessionRun.mockClear();
    mockSessionClose.mockClear();
    mockSession.mockClear();
    mockDriverClose.mockClear();
    mockDriverFunction.mockClear();

    process.env = { ...originalEnv };
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;

    // Reset our in-memory file system.
    vol.reset();

    mockConfig = { features: { neo4j: 'auto' } };
    mockNeo4jModule = {
      driver: mockDriverFunction,
      auth: { basic: mock(() => 'mock-auth-token') },
    };

    service = new CodeIntelligenceService(mockConfig, mockNeo4jModule);
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  test('should successfully connect to Neo4j when credentials are valid', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    const connectionStatus = await service.testConnection();
    expect(connectionStatus.status).toBe('ok');
    expect(connectionStatus.mode).toBe('database');
  });

  test('should fall back to memory mode if Neo4j connection fails in auto mode', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    mockVerifyConnectivity.mockImplementation(() => { throw new Error('Connection failed'); });
    const connectionStatus = await service.testConnection();
    expect(connectionStatus.mode).toBe('memory');
  });

  test('should return error if Neo4j connection fails in required mode', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    service.config.features.neo4j = 'required';
    mockVerifyConnectivity.mockImplementation(() => { throw new Error('Connection failed'); });
    const connectionStatus = await service.testConnection();
    expect(connectionStatus.status).toBe('error');
  });

  test('should fall back to memory mode if credentials are missing', async () => {
    const connectionStatus = await service.testConnection();
    expect(connectionStatus.mode).toBe('memory');
  });

  test('should explicitly run in memory mode if config.features.neo4j is set to memory', async () => {
    service.config.features.neo4j = 'memory';
    const connectionStatus = await service.testConnection();
    expect(connectionStatus.mode).toBe('memory');
  });

  test('findUsages should return empty array in memory mode', async () => {
    service.config.features.neo4j = 'memory';
    await service.testConnection();
    const usages = await service.findUsages({ symbolName: 'testSymbol' });
    expect(usages).toEqual([]);
  });

  test('should correctly build a knowledge graph for a simple project', async () => {
    // 1. Setup fixture directory IN-MEMORY using our mockFs.
    await mockFs.ensureDir(fixturePath);
    const utilPath = path.join(fixturePath, 'util.js');
    const mainPath = path.join(fixturePath, 'main.js');
    await mockFs.writeFile(utilPath, "export const helper = () => 'world';");
    await mockFs.writeFile(mainPath, "import { helper } from './util.js'; function mainFunc() { console.log(helper()); }");

    // 2. Configure service for database mode.
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    service.config.features.neo4j = 'required';
    await service.initializeDriver();

    // 3. Run the service. It will now use the mocked fs-extra to read the in-memory files.
    const filePaths = await service.scanProjectStructure(fixturePath);
    const { symbols, relationships } = await service.extractSemanticInformation(filePaths);
    await service.buildKnowledgeGraph(symbols, relationships);

    // 4. Assertions.
    expect(mockTxCommit).toHaveBeenCalledTimes(1);
    const runCalls = mockTxRun.mock.calls;
    const helperSymbolCall = runCalls.find(call => call[0].includes('MERGE (s:Symbol') && call[1].name === 'helper');
    expect(helperSymbolCall).toBeDefined();
  });
});