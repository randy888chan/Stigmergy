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
        // Create simple, local mocks for the dependencies.
        const mockGenerateObject = mock().mockResolvedValue({ object: { passed: true, feedback: 'test feedback' } });
        const mockGetModelForTier = mock(() => 'mock-model');

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await verify_requirements(
          { requirements: "reqs", code: "code", ai: mockAiProvider, generateObject: mockGenerateObject }
        );

        // Assert that our local mocks were called and the result is correct.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier');
        expect(result.passed).toBe(true);
    });
    
    test('verify_architecture should use the injected AI functions', async () => {
        // Create simple, local mocks for the dependencies.
        const mockGenerateObject = mock().mockResolvedValue({ object: { passed: false, feedback: 'test feedback' } });
        const mockGetModelForTier = mock(() => 'mock-model');

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await verify_architecture(
          { architecture_blueprint: "blueprint", code: "code", ai: mockAiProvider, generateObject: mockGenerateObject }
        );

        // Assert that our local mocks were called and the result is correct.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier');
        expect(result.passed).toBe(false);
    });
});