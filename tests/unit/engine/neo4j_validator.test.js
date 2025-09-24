import { mock, describe, it, expect, beforeEach, afterEach, spyOn } from 'bun:test';

// Mock the dependency using the ESM-compatible API
// We mock the entire class and the methods that will be called.
const mockTestConnection = mock();
mock.module('../../../services/code_intelligence_service.js', () => ({
  CodeIntelligenceService: mock().mockImplementation(() => ({
    testConnection: mockTestConnection,
  })),
}));

describe('Neo4jValidator', () => {
  let Neo4jValidator;
  let CodeIntelligenceService;

  beforeEach(async () => {
    // Dynamically import the modules to get the mocked versions
    Neo4jValidator = (await import('../../../engine/neo4j_validator.js')).Neo4jValidator;
    CodeIntelligenceService = (await import('../../../services/code_intelligence_service.js')).CodeIntelligenceService;

    // Reset mocks before each test
    mock.restore();
    mockTestConnection.mockReset();
  });

  afterEach(() => {
    mock.restore();
  });

  it('should return { success: true } when CodeIntelligenceService reports a successful connection', async () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

    mockTestConnection.mockResolvedValue({
      status: 'ok',
      message: 'Connection successful',
    });

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(true);
    expect(CodeIntelligenceService).toHaveBeenCalled();
    expect(mockTestConnection).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Checking Neo4j connection...');
    expect(console.log).toHaveBeenCalledWith(' -> Neo4j status OK: Connection successful');
    
    consoleSpy.mockRestore();
  });

  it('should return { success: false } and an error message when CodeIntelligenceService reports a failed connection', async () => {
    const consoleSpy = spyOn(console, 'log').mockImplementation(() => {});

    mockTestConnection.mockResolvedValue({
      status: 'error',
      message: 'Connection failed',
    });

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(false);
    expect(result.error).toBe('Neo4j connection failed: Connection failed');
    expect(CodeIntelligenceService).toHaveBeenCalled();
    expect(mockTestConnection).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Checking Neo4j connection...');

    consoleSpy.mockRestore();
  });
});
