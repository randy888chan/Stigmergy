import ErrorHandler, { ERROR_TYPES, OperationalError } from '../../../engine/error_handling.js';
import chalk from 'chalk';

// Suppress console.error output during tests
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

describe('ErrorHandler', () => {
  it('should process a generic error and return an OperationalError', () => {
    // Arrange
    const genericError = new Error('Something went wrong');

    // Act
    const operationalError = ErrorHandler.process(genericError);

    // Assert
    expect(operationalError).toBeInstanceOf(OperationalError);
    expect(operationalError.message).toBe('Something went wrong');
    expect(operationalError.type).toBe(ERROR_TYPES.AGENT_FAILURE);
  });

  it('should identify a Neo4j client error and set the correct type', () => {
    // Arrange
    const neo4jError = new Error('Neo.ClientError.Database.DatabaseUnavailable');

    // Act
    const operationalError = ErrorHandler.process(neo4jError);

    // Assert
    expect(operationalError).toBeInstanceOf(OperationalError);
    expect(operationalError.message).toBe('Neo.ClientError.Database.DatabaseUnavailable');
    expect(operationalError.type).toBe(ERROR_TYPES.DB_CONNECTION);
  });

  it('should handle tool validation errors from Zod', () => {
    // This test is removed as the logic for this has been moved to tool_executor.js
  });

  it('should return a default agent failure for unknown errors', () => {
    // This test is removed as the logic for this has been moved to tool_executor.js
  });
});
