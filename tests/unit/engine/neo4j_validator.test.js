import { Neo4jValidator } from '../../../engine/neo4j_validator.js';
import { CodeIntelligenceService } from '../../../services/code_intelligence_service.js';

jest.mock('../../../services/code_intelligence_service.js');

describe('Neo4jValidator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return { success: true } when CodeIntelligenceService reports a successful connection', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    CodeIntelligenceService.prototype.testConnection.mockResolvedValue({
      status: 'ok',
      message: 'Connection successful',
    });

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(true);
    expect(console.log).toHaveBeenCalledWith('Checking Neo4j connection...');
    expect(console.log).toHaveBeenCalledWith(' -> Neo4j status OK: Connection successful');
    
    consoleSpy.mockRestore();
  });

  it('should return { success: false } and an error message when CodeIntelligenceService reports a failed connection', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    CodeIntelligenceService.prototype.testConnection.mockResolvedValue({
      status: 'error',
      message: 'Connection failed',
    });

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Neo4j connection failed: Connection failed');
    expect(console.log).toHaveBeenCalledWith('Checking Neo4j connection...');

    consoleSpy.mockRestore();
  });
});
