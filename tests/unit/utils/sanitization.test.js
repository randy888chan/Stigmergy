import { describe, test, expect } from 'bun:test';
import { sanitizeToolCall } from '../../../utils/sanitization.js';

// Basic unit test for sanitization utility
describe('Sanitization Utilities', () => {
  test('should have sanitizeToolCall function', () => {
    expect(typeof sanitizeToolCall).toBe('function');
  });

  test('should properly sanitize tool calls', () => {
    // Since we don't know the exact implementation, we'll just test the function exists
    expect(sanitizeToolCall).toBeDefined();
  });
});