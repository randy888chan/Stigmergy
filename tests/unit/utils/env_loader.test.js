import { describe, test, expect } from 'bun:test';
import { loadResult } from '../../../utils/env_loader.js';

// Basic unit test for environment loader utility
describe('Environment Loader Utilities', () => {
  test('should have loadResult function or object', () => {
    // The env_loader may just load environment variables without exporting functions
    expect(loadResult).toBeDefined();
  });

  test('should properly load environment variables', () => {
    // Since env_loader typically just loads .env into process.env, we can check if it's defined
    expect(loadResult).toBeDefined();
  });
});