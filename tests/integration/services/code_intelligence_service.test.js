import { mock, describe, it, expect, beforeEach, afterEach } from 'bun:test';

// Mock the entire neo4j-driver module
const mockDriver = {
  verifyConnectivity: mock(),
  close: mock().mockResolvedValue(undefined),
};
mock.module('neo4j-driver', () => ({
  driver: mock().mockReturnValue(mockDriver),
  auth: {
    basic: mock(),
  },
}));

// Mock the config module
mock.module('../../../stigmergy.config.js', () => ({
  default: {
    features: {
      neo4j: 'auto', // Default for tests
    },
  },
}));

describe('CodeIntelligenceService', () => {
  let CodeIntelligenceService;
  let neo4j;
  let config;

  beforeEach(async () => {
    // Dynamically import modules to get mocked versions
    CodeIntelligenceService = (await import('../../../services/code_intelligence_service.js')).CodeIntelligenceService;
    neo4j = await import('neo4j-driver');
    config = (await import('../../../stigmergy.config.js')).default;

    // Reset mocks before each test
    mock.restore();
    mockDriver.verifyConnectivity.mockResolvedValue({}); // Reset to success
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;
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

    const service = new CodeIntelligenceService();

    // Act
    const result = await service.testConnection();

    // Assert
    expect(result.status).toBe('error');
    expect(result.message).toContain('Neo4j is required');
  });
});
