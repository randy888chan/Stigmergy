import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule('../../stigmergy.config.js', () => ({
  default: {
    features: { neo4j: 'auto' }
  },
}));
const mockDriverInstance = {
  verifyConnectivity: jest.fn(),
  close: jest.fn(),
};
jest.unstable_mockModule('neo4j-driver', () => ({
  driver: jest.fn().mockReturnValue(mockDriverInstance),
  auth: {
    basic: jest.fn(),
  },
}));

describe('Fallback Manager Resilience', () => {
  let CodeIntelligenceService;
  let config;
  let neo4j;

  beforeEach(async () => {
    // Dynamically import modules to get mocked versions
    CodeIntelligenceService = (await import('../../services/code_intelligence_service.js')).CodeIntelligenceService;
    config = (await import('../../stigmergy.config.js')).default;
    neo4j = await import('neo4j-driver');

    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test("should fallback to 'memory' mode when connection fails in 'auto' mode", async () => {
    // Arrange
    config.features.neo4j = 'auto';
    mockDriverInstance.verifyConnectivity.mockRejectedValue(new Error("ECONNREFUSED"));

    const codeIntelligenceService = new CodeIntelligenceService();
    const result = await codeIntelligenceService.testConnection();

    // Assert
    expect(result.status).toBe('ok');
    expect(result.mode).toBe('memory');
    expect(codeIntelligenceService.isMemoryMode).toBe(true);

    // Ensure other methods work in fallback mode
    const usages = await codeIntelligenceService.findUsages({ symbolName: 'test' });
    expect(usages).toEqual([]);
  });
});
