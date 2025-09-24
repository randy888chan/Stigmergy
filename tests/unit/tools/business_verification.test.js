import { jest, describe, test, expect, beforeEach } from '@jest/globals';

// Mock dependencies before importing the actual modules
jest.unstable_mockModule("../../../ai/providers.js", () => ({
  getModelForTier: jest.fn(),
}));
jest.unstable_mockModule("ai", () => ({
  generateObject: jest.fn(),
}));

describe("Business Verification Tools", () => {
  let getModelForTier;
  let generateObject;
  let generate_financial_projections;
  let perform_business_valuation;

  beforeEach(async () => {
    // Dynamically import modules inside beforeEach to use the mocked versions
    getModelForTier = (await import("../../../ai/providers.js")).getModelForTier;
    generateObject = (await import("ai")).generateObject;
    const businessTools = await import("../../../tools/business_verification.js");
    generate_financial_projections = businessTools.generate_financial_projections;
    perform_business_valuation = businessTools.perform_business_valuation;

    // Clear mocks before each test
    jest.clearAllMocks();
  });

  describe("generate_financial_projections", () => {
    test("should call generateObject and return its result", async () => {
      const mockResponse = {
        projections: [{ year: 1, revenue: "100k", cogs: "20k", opex: "30k", net_profit: "50k" }],
        summary: "Looks good",
      };
      generateObject.mockResolvedValue({ object: mockResponse });

      const result = await generate_financial_projections({ business_plan_content: "A great plan" });

      expect(getModelForTier).toHaveBeenCalledWith("b_tier");
      expect(generateObject).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe("perform_business_valuation", () => {
    test("should call generateObject and return its result", async () => {
        const mockResponse = {
            swot_analysis: { strengths: [], weaknesses: [], opportunities: [], threats: [] },
            qualitative_valuation: "It's valuable.",
            estimated_value_range: "1M-2M"
        };
        generateObject.mockResolvedValue({ object: mockResponse });

        const result = await perform_business_valuation({ business_plan_content: "A great plan" });

        expect(getModelForTier).toHaveBeenCalledWith("b_tier");
        expect(generateObject).toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
      });
  });
});