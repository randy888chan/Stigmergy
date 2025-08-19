import { CodeIntelligenceService } from '../../services/code_intelligence_service.js';
import config from '../../stigmergy.config.js';
import neo4j from 'neo4j-driver';

jest.mock('../../stigmergy.config.js', () => ({ features: { neo4j: 'auto' } }));
jest.mock('neo4j-driver');

describe('Fallback Manager Resilience', () => {
  test("should fallback to 'memory' mode when connection fails in 'auto' mode", async () => {
    config.features.neo4j = 'auto';
    neo4j.driver.mockImplementation(() => ({
        verifyConnectivity: jest.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    }));

    const codeIntelligenceService = new CodeIntelligenceService();
    const result = await codeIntelligenceService.testConnection();

    expect(result.success).toBe(true);
    expect(result.type).toBe('memory');
    expect(codeIntelligenceService.isMemoryMode).toBe(true);

    const usages = await codeIntelligenceService.findUsages({ symbolName: 'test' });
    expect(usages).toEqual([]);
  });
});
