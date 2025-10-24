import { mock, describe, test, expect } from 'bun:test';

// Import the QA tools module
import { verify_requirements, verify_architecture, run_tests_and_check_coverage } from '../../../tools/qa_tools.js';

describe('QA Tools', () => {
    test('should have QA tool functions', () => {
        expect(typeof verify_requirements).toBe('function');
        expect(typeof verify_architecture).toBe('function');
        expect(typeof run_tests_and_check_coverage).toBe('function');
    });
    
    test('verify_requirements should use the injected AI functions', async () => {
        // Create mocks that reflect the new { client, modelName } structure.
        const mockGenerateObject = mock().mockResolvedValue({ object: { passed: true, feedback: 'test feedback' } });
        const mockClient = mock(() => 'mock-model-from-client');
        const mockGetModelForTier = mock(() => ({
          client: mockClient,
          modelName: 'mock-model-name',
        }));

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await verify_requirements(
          { requirements: "reqs", code: "code", ai: mockAiProvider, generateObject: mockGenerateObject, config: undefined, engine: {} }
        );

        // Assert that our local mocks were called correctly.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier', null, undefined);
        expect(mockClient).toHaveBeenCalledWith('mock-model-name');
        expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({ model: 'mock-model-from-client' }), {});
        expect(result.passed).toBe(true);
    });
    
    test('verify_architecture should use the injected AI functions', async () => {
        // Create mocks that reflect the new { client, modelName } structure.
        const mockGenerateObject = mock().mockResolvedValue({ object: { passed: false, feedback: 'test feedback' } });
        const mockClient = mock(() => 'mock-model-from-client');
        const mockGetModelForTier = mock(() => ({
          client: mockClient,
          modelName: 'mock-model-name',
        }));

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await verify_architecture(
          { architecture_blueprint: "blueprint", code: "code", ai: mockAiProvider, generateObject: mockGenerateObject, config: undefined, engine: {} }
        );

        // Assert that our local mocks were called correctly.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier', null, undefined);
        expect(mockClient).toHaveBeenCalledWith('mock-model-name');
        expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({ model: 'mock-model-from-client' }), {});
        expect(result.passed).toBe(false);
    });
});