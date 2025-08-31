import { Neo4jValidator } from '../../../engine/neo4j_validator.js';
import neo4j from 'neo4j-driver';

// Mock the entire neo4j-driver module
jest.mock('neo4j-driver');

describe('Neo4jValidator', () => {
  let mockSession;
  let mockDriver;

  beforeEach(() => {
    // Clear all mocks before each test to ensure isolation
    jest.clearAllMocks();

    // Set up a default mock implementation for the neo4j driver
    mockSession = {
      run: jest.fn().mockResolvedValue({}),
      close: jest.fn().mockResolvedValue(),
    };
    mockDriver = {
      session: jest.fn(() => mockSession),
      close: jest.fn().mockResolvedValue(),
    };
    neo4j.driver.mockReturnValue(mockDriver);
  });

  it('should return { success: true } when the connection is valid', async () => {
    // Suppress console.log for this test
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();
    expect(neo4j.driver).toHaveBeenCalledWith(
      process.env.NEO4J_URI || "bolt://localhost:7687",
      neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD)
    );
    expect(mockDriver.session).toHaveBeenCalled();
    expect(mockSession.run).toHaveBeenCalledWith('RETURN 1 AS test');
    expect(mockSession.close).toHaveBeenCalled();
    expect(mockDriver.close).toHaveBeenCalled();
    
    consoleSpy.mockRestore();
  });

  it('should return an error object when the driver fails to connect', async () => {
    const errorMessage = 'Connection refused';
    // Make the driver throw an error when called
    neo4j.driver.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Neo4j connection failed');
    expect(result.error).toContain(errorMessage);
  });

  it('should return an error object when running the query fails', async () => {
    const errorMessage = 'Invalid Cypher syntax';
    // Make the session's run method reject
    mockSession.run.mockRejectedValue(new Error(errorMessage));

    const result = await Neo4jValidator.validate();

    expect(result.success).toBe(false);
    expect(result.error).toContain('Neo4j connection failed');
    expect(result.error).toContain(errorMessage);
    // Ensure that close methods are not called if run fails
    expect(mockSession.close).not.toHaveBeenCalled();
    expect(mockDriver.close).not.toHaveBeenCalled();
  });
});
