import { CodeIntelligenceService } from '../../services/code_intelligence_service.js';
import config from '../../stigmergy.config.js';
import neo4j from 'neo4j-driver';

// Mock the config to control the feature flag
jest.mock('../../stigmergy.config.js', () => ({
  features: {
    neo4j: 'auto', // Default to 'auto' for this test suite
  },
}));

// Mock the neo4j driver
jest.mock('neo4j-driver');

describe('Fallback Manager Resilience', () => {

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    // Reset the service's internal state if necessary
    // This might require a dedicated method in the service for testing
  });

  test("should fallback to 'memory' mode when neo4j connection fails in 'auto' mode", async () => {
    // Arrange
    config.features.neo4j = 'auto';
    const connectionError = new Error("ECONNREFUSED");
    neo4j.driver.mockImplementation(() => ({
        session: () => ({
            run: jest.fn().mockRejectedValue(connectionError),
            close: jest.fn().mockResolvedValue(undefined),
        }),
        close: jest.fn().mockResolvedValue(undefined),
    }));

    const codeIntelligenceService = new CodeIntelligenceService();

    // Act
    const result = await codeIntelligenceService.testConnection();

    // Assert
    expect(result.success).toBe(true);
    expect(result.type).toBe('memory');
    expect(result.warning).toContain('Fell back to memory mode');
    expect(codeIntelligenceService.isMemoryMode).toBe(true);

    // Further Act & Assert: Ensure data methods don't throw and return empty
    const usages = await codeIntelligenceService.findUsages({ symbolName: 'test' });
    expect(usages).toEqual([]);
  });

  test("should not fallback to 'memory' mode when neo4j is 'required'", async () => {
    // Arrange
    config.features.neo4j = 'required';
    const connectionError = new Error("ECONNREFUSED");
    neo4j.driver.mockImplementation(() => {
        // Mock the driver to throw an error on session creation or run
        return {
            session: () => ({
                run: jest.fn().mockRejectedValue(connectionError),
                close: jest.fn().mockResolvedValue(undefined),
            }),
            close: jest.fn().mockResolvedValue(undefined),
        };
    });

    const codeIntelligenceService = new CodeIntelligenceService();

    // Act
    const result = await codeIntelligenceService.testConnection();

    // Assert
    expect(result.success).toBe(false);
    expect(result.type).toBe('connection_failed');
    expect(codeIntelligenceService.isMemoryMode).toBe(false);
  });
});
