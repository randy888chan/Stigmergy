// Mock dependencies before importing the actual modules
jest.mock("../../../ai/providers.js");
jest.mock("ai", () => ({
  generateObject: jest.fn(),
}));

import { getModelForTier } from "../../../ai/providers.js";
import { generateObject } from "ai";
import {
  generate_financial_projections,
  perform_business_valuation,
} from "../../../tools/business_verification.js";

describe("Business Verification Tools", () => {
  beforeEach(() => {
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