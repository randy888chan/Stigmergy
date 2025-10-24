import { mock, describe, test, expect } from 'bun:test';

// Import the business verification tools module
import { generate_financial_projections, perform_business_valuation } from '../../../tools/business_verification.js';

describe('Business Verification Tools', () => {
    test('should have all required business verification functions', () => {
        expect(typeof generate_financial_projections).toBe('function');
        expect(typeof perform_business_valuation).toBe('function');
    });
    
    test('generate_financial_projections should use the injected AI functions', async () => {
        // Create mocks that reflect the new { client, modelName } structure.
        const mockGenerateObject = mock().mockResolvedValue({ 
            object: { 
                projections: [
                    { year: 1, revenue: "100k", cogs: "50k", opex: "30k", net_profit: "20k" }
                ],
                summary: "test summary" 
            } 
        });
        const mockClient = mock(() => 'mock-model-from-client');
        const mockGetModelForTier = mock(() => ({
          client: mockClient,
          modelName: 'mock-model-name',
        }));

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await generate_financial_projections(
          { business_plan_content: "test plan", ai: mockAiProvider, generateObject: mockGenerateObject, config: undefined, engine: {} }
        );

        // Assert that our local mocks were called correctly.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier', null, undefined);
        expect(mockClient).toHaveBeenCalledWith('mock-model-name');
        expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({ model: 'mock-model-from-client' }), {});
        expect(result.projections).toBeDefined();
        expect(result.summary).toBe("test summary");
    });
    
    test('perform_business_valuation should use the injected AI functions', async () => {
        // Create mocks that reflect the new { client, modelName } structure.
        const mockGenerateObject = mock().mockResolvedValue({ 
            object: { 
                swot_analysis: {
                    strengths: ["strong team"],
                    weaknesses: ["limited funding"],
                    opportunities: ["market gap"],
                    threats: ["competition"]
                },
                qualitative_valuation: "promising",
                estimated_value_range: "$1M - $5M"
            } 
        });
        const mockClient = mock(() => 'mock-model-from-client');
        const mockGetModelForTier = mock(() => ({
          client: mockClient,
          modelName: 'mock-model-name',
        }));

        const mockAiProvider = {
            getModelForTier: mockGetModelForTier,
        };

        const result = await perform_business_valuation(
          { business_plan_content: "test plan", ai: mockAiProvider, generateObject: mockGenerateObject, config: undefined, engine: {} }
        );

        // Assert that our local mocks were called correctly.
        expect(mockGetModelForTier).toHaveBeenCalledWith('b_tier', null, undefined);
        expect(mockClient).toHaveBeenCalledWith('mock-model-name');
        expect(mockGenerateObject).toHaveBeenCalledWith(expect.objectContaining({ model: 'mock-model-from-client' }), {});
        expect(result.swot_analysis).toBeDefined();
        expect(result.qualitative_valuation).toBe("promising");
    });
});