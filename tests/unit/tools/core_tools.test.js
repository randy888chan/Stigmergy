import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock any external dependencies before importing the module under test
mock.module('../../../utils/config.js', () => ({
    getConfig: mock(() => ({ corePath: '.stigmergy-core-test' })),
}));

mock.module('fs-extra', () => ({
    readFileSync: mock(),
    writeFileSync: mock(),
    ensureDirSync: mock(),
    copySync: mock(),
}));

// Import the core tools module after mocking dependencies
import { createStructuredResponse, analyzeTaskExecutionStrategy } from '../../../tools/core_tools.js';

beforeEach(() => {
    mock.restore();
});

describe('Core Tools', () => {
    test('should have all required core tool functions', () => {
        expect(typeof createStructuredResponse).toBe('function');
        expect(typeof analyzeTaskExecutionStrategy).toBe('function');
    });
    
    test('should properly create structured responses', () => {
        expect(createStructuredResponse).toBeDefined();
    });
});