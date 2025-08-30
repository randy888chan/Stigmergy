import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';
import neo4j from 'neo4j-driver';
import config from '../../../stigmergy.config.js';

// Mock the entire neo4j-driver module
jest.mock('neo4j-driver');
// Mock the config module
jest.mock('../../../stigmergy.config.js');

describe('CodeIntelligenceService', () => {
  let mockDriver;

  beforeEach(() => {
    // Create a mock driver object
    mockDriver = {
      verifyConnectivity: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(undefined),
    };

    // Tell the neo4j module to return our mock driver
    neo4j.driver.mockReturnValue(mockDriver);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should test connection successfully when neo4j is "required"', async () => {
    // Arrange
    config.features.neo4j = 'required';
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    
    const service = new CodeIntelligenceService();
    
    // Act
    const result = await service.testConnection();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.mode).toBe('database');
    expect(mockDriver.verifyConnectivity).toHaveBeenCalled();
  });

  it('should fall back to memory mode when neo4j is "auto" and creds are missing', async () => {
    // Arrange
    config.features.neo4j = 'auto';
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;
    
    const service = new CodeIntelligenceService();

    // Act
    const result = await service.testConnection();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.mode).toBe('memory');
    expect(mockDriver.verifyConnectivity).not.toHaveBeenCalled();
  });

  it('should handle connection failure and fall back to memory mode when neo4j is "auto"', async () => {
    // Arrange
    config.features.neo4j = 'auto';
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    mockDriver.verifyConnectivity.mockRejectedValue(new Error('Connection failed'));
    
    const service = new CodeIntelligenceService();
    
    // Act
    const result = await service.testConnection();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.mode).toBe('memory');
    expect(result.message).toContain('Connection failed');
  });

  it('should return an error when neo4j is "required" and creds are missing', async () => {
    // Arrange
    config.features.neo4j = 'required';
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;

    const service = new CodeIntelligenceService();

    // Act
    const result = await service.testConnection();

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toContain('Neo4j is required');
  });
});
