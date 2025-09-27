import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'fs-extra';
import path from 'path';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';
import * as neo4j from 'neo4j-driver'; // Keep this import for `...neo4j`

// Mock neo4j-driver components
const mockTxRun = mock(() => Promise.resolve());
const mockTxCommit = mock(() => Promise.resolve());
const mockTxRollback = mock(() => Promise.resolve());
const mockTransaction = {
  run: mockTxRun,
  commit: mockTxCommit,
  rollback: mockTxRollback,
};

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

// Define the mock driver function once
const mockDriverFunction = mock(() => mockDriver);

import config from '../../../stigmergy.config.js'; // This import can stay here

// Temporarily store original process.env

describe('CodeIntelligenceService Integration', () => {
  const originalEnv = process.env;
  let service;
  let mockConfig;
  let CodeIntelligenceService;
  let mockNeo4jModule; // Define it here
  const fixturePath = path.join(process.cwd(), 'temp-test-project-knowledge-graph');


  beforeEach(async () => {
    // Dynamically import CodeIntelligenceService after mock.module is set up
    const module = await import('../../../services/code_intelligence_service.js');
    CodeIntelligenceService = module.CodeIntelligenceService;

    // Reset mocks
    mockVerifyConnectivity.mockClear();
    mockSessionRun.mockClear();
    mockSessionClose.mockClear();
    mockSession.mockClear();
    mockDriverClose.mockClear();
    mockDriverFunction.mockClear(); // Clear the mock driver function
    mockTxRun.mockClear();
    mockTxCommit.mockClear();
    mockTxRollback.mockClear();


    // Reset environment variables
    process.env = { ...originalEnv };
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;

    // Create a mock config object
    mockConfig = {
      features: {
        neo4j: 'auto', // Default for tests, can be overridden per test
      },
    };

    // Create a mock neo4j module
    mockNeo4jModule = {
      driver: mockDriverFunction, // Use the single mock driver function
      auth: {
        basic: mock(() => 'mock-auth-token'), // Mock basic auth
      },
    };

    // Re-instantiate service for each test with mock config and mock neo4j module
    service = new CodeIntelligenceService(mockConfig, mockNeo4jModule);

    // Clean up fixture directory
    await fs.remove(fixturePath);
  });

  afterEach(async () => {
    // Restore original environment variables
    process.env = originalEnv;
    // Clean up fixture directory
    await fs.remove(fixturePath);
  });

  test('should successfully connect to Neo4j when credentials are valid', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    const connectionStatus = await service.testConnection();

    expect(mockDriverFunction).toHaveBeenCalledTimes(1);
    expect(mockVerifyConnectivity).toHaveBeenCalledTimes(1);
    expect(connectionStatus.status).toBe('ok');
    expect(connectionStatus.mode).toBe('database');
    expect(connectionStatus.message).toContain('Connected to Neo4j');
    expect(connectionStatus.version).toBe('5.17.0');
  });

  test('should fall back to memory mode if Neo4j connection fails in auto mode', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password'; // Need to set password so the driver gets initialized
    mockConfig.features.neo4j = 'auto';
    
    // Set up the mock to throw an error on verifyConnectivity
    mockVerifyConnectivity.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const connectionStatus = await service.testConnection();

    expect(mockDriverFunction).toHaveBeenCalledTimes(1);
    expect(mockVerifyConnectivity).toHaveBeenCalledTimes(1);
    expect(connectionStatus.status).toBe('ok');
    expect(connectionStatus.mode).toBe('memory');
    expect(connectionStatus.fallback_reason).toContain('Connection error');
  });

  test('should return error if Neo4j connection fails in required mode', async () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password'; // Need to set password so the driver gets initialized
    mockConfig.features.neo4j = 'required';
    
    // Set up the mock to throw an error on verifyConnectivity
    mockVerifyConnectivity.mockImplementation(() => {
      throw new Error('Connection failed');
    });

    const connectionStatus = await service.testConnection();

    expect(mockDriverFunction).toHaveBeenCalledTimes(1);
    expect(mockVerifyConnectivity).toHaveBeenCalledTimes(1);
    expect(connectionStatus.status).toBe('error');
    expect(connectionStatus.mode).toBe('database');
    expect(connectionStatus.message).toContain('Neo4j connection failed');
  });

  test('should fall back to memory mode if credentials are missing', async () => {
    mockConfig.features.neo4j = 'auto';

    const connectionStatus = await service.testConnection();

    expect(mockDriverFunction).not.toHaveBeenCalled(); // Driver should not be initialized
    expect(connectionStatus.status).toBe('ok');
    expect(connectionStatus.mode).toBe('memory');
    expect(connectionStatus.fallback_reason).toContain('Missing Neo4j credentials');
  });

  test('should explicitly run in memory mode if config.features.neo4j is set to memory', async () => {
    mockConfig.features.neo4j = 'memory';

    const connectionStatus = await service.testConnection();

    expect(mockDriverFunction).not.toHaveBeenCalled();
    expect(connectionStatus.status).toBe('ok');
    expect(connectionStatus.mode).toBe('memory');
    expect(connectionStatus.fallback_reason).toContain('Explicitly set to memory mode');
  });

  test('findUsages should return empty array in memory mode', async () => {
    mockConfig.features.neo4j = 'memory';
    await service.testConnection(); // Ensure service is initialized in memory mode

    const usages = await service.findUsages({ symbolName: 'testSymbol' });

    expect(usages).toEqual([]);
  });

  test('should correctly build a knowledge graph for a simple project', async () => {
    // 1. Setup fixture directory
    await fs.ensureDir(fixturePath);
    const utilPath = path.join(fixturePath, 'util.js');
    const mainPath = path.join(fixturePath, 'main.js');

    await fs.writeFile(utilPath, "export const helper = () => 'world'; export function anotherFunc() {}");
    await fs.writeFile(mainPath, "import { helper } from './util.js'; class MyClass {}; function mainFunc() { console.log('hello', helper()); };");

    // 2. Configure service for database mode
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    service.config.features.neo4j = 'required'; // Force database mode

    await service.initializeDriver(); // Initialize driver explicitly for the test

    // 3. Run the service methods
    const filePaths = await service.scanProjectStructure(fixturePath);
    const { symbols, relationships } = await service.extractSemanticInformation(filePaths);
    await service.buildKnowledgeGraph(symbols, relationships);

    // 4. Assertions
    expect(mockTxCommit).toHaveBeenCalledTimes(1);

    // Check for specific symbol creations
    const createdSymbols = mockTxRun.mock.calls.filter(call => call[0].includes('MERGE (s:Symbol'));
    const symbolNames = createdSymbols.map(call => call[1].name);

    expect(symbolNames).toContain('anotherFunc');
    expect(symbolNames).toContain('MyClass');
    expect(symbolNames).toContain('mainFunc');

    // Check for specific relationship creations
    const createdRelationships = mockTxRun.mock.calls.filter(call => call[0].includes('MERGE (a)-[:'));

    const importsRel = createdRelationships.find(call => call[0].includes('IMPORTS'));
    expect(importsRel[1]).toEqual({ from: 'helper', to: './util.js' });

    const callsRel = createdRelationships.find(call => call[0].includes('CALLS'));
    expect(callsRel[1]).toEqual({ from: 'mainFunc', to: 'helper' });

    const exportsRels = createdRelationships.filter(call => call[0].includes('EXPORTS'));
    const exportSources = exportsRels.map(call => call[1].from);
    expect(exportSources).toContain('helper');
    expect(exportSources).toContain('anotherFunc');
  });
});