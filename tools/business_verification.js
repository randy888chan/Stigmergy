import fs from "fs-extra";
import path from "path";
import { generateObject as defaultGenerateObject } from "ai";
import { z } from "zod";

export async function generate_financial_projections({ business_plan_content, ai, generateObject = defaultGenerateObject, config }) {
  const { object } = await generateObject({
    model: ai.getModelForTier('b_tier', null, config),
    prompt: `Based on the following business plan, generate a simple 5-year financial projection table focusing on Revenue, COGS, OpEx, and Net Profit.`,
    schema: z.object({
      projections: z
        .array(
          z.object({
            year: z.number(),
            revenue: z.string(),
            cogs: z.string(),
            opex: z.string(),
            net_profit: z.string(),
          })
        )
        .length(5),
      summary: z.string(),
    }),
  });
  return object;
}

export async function perform_business_valuation({ business_plan_content, ai, generateObject = defaultGenerateObject, config }) {
  const { object } = await generateObject({
    model: ai.getModelForTier('b_tier', null, config),
    prompt: `Analyze the provided business plan and perform a SWOT analysis. Provide a qualitative valuation summary.`,
    schema: z.object({
      swot_analysis: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        opportunities: z.array(z.string()),
        threats: z.array(z.string()),
      }),
      qualitative_valuation: z.string(),
      estimated_value_range: z.string(),
    }),
  });
  return object;
}
