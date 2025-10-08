import { describe, test, expect, beforeEach, afterAll } from 'bun:test';
import { getConfig } from '../../src/coderag/config.js';

describe('Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Bun's test runner isolates modules, so resetModules is not needed.
    // We manually reset process.env before each test.
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test('should return valid config when all environment variables are set', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';

    const config = getConfig();

    expect(config).toEqual({
      uri: 'bolt://localhost:7687',
      user: 'neo4j',
      password: 'password'
    });
  });

  test('should throw error when NEO4J_URI is missing', () => {
    process.env.NEO4J_USER = 'neo4j';
    process.env.NEO4J_PASSWORD = 'password';
    delete process.env.NEO4J_URI;

    expect(() => getConfig()).toThrow('Missing required Neo4J configuration');
  });

  test('should throw error when NEO4J_USER is missing', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_PASSWORD = 'password';
    delete process.env.NEO4J_USER;

    expect(() => getConfig()).toThrow('Missing required Neo4J configuration');
  });

  test('should throw error when NEO4J_PASSWORD is missing', () => {
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USER = 'neo4j';
    delete process.env.NEO4J_PASSWORD;

    expect(() => getConfig()).toThrow('Missing required Neo4J configuration');
  });
});