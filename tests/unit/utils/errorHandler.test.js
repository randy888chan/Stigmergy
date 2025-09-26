import { describe, test, expect } from 'bun:test';
import errorHandler from '../../../utils/errorHandler.js';
import { ERROR_TYPES, OperationalError } from '../../../utils/errorHandler.js';

// Basic unit test for error handler utility
describe('Error Handler Utilities', () => {
  test('should have error handler instance', () => {
    expect(errorHandler).toBeDefined();
    expect(typeof errorHandler.process).toBe('function');
  });

  test('should process errors properly', () => {
    const error = new Error('test error');
    const processed = errorHandler.process(error);
    expect(processed).toBeDefined();
    expect(processed instanceof Error).toBe(true);
  });

  test('should have ERROR_TYPES defined', () => {
    expect(ERROR_TYPES).toBeDefined();
    expect(ERROR_TYPES.DB_CONNECTION).toBeDefined();
    expect(ERROR_TYPES.TOOL_EXECUTION).toBeDefined();
  });

  test('should create OperationalError instances', () => {
    const opError = new OperationalError('test message', ERROR_TYPES.DB_CONNECTION);
    expect(opError).toBeInstanceOf(OperationalError);
    expect(opError.type).toBe(ERROR_TYPES.DB_CONNECTION);
  });
});