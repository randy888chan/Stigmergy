import fs from "fs-extra";
import path from "path";
import { getModel } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";

export async function verify_business_alignment({ business_plan_path, keywords }) {
  try {
    const planContent = await fs.readFile(path.resolve(process.cwd(), business_plan_path), "utf-8");
    const missingKeywords = keywords.filter(
      (k) => !planContent.toLowerCase().includes(k.toLowerCase())
    );

    if (missingKeywords.length > 0) {
      return {
        verified: false,
        feedback: `The document at ${business_plan_path} is missing key business concepts: ${missingKeywords.join(", ")}`,
      };
    }
    return { verified: true, feedback: "All key business concepts are present." };
  } catch (error) {
    return { verified: false, feedback: `Error reading business plan: ${error.message}` };
  }
}

/**
 * NEW TOOL: Generates a basic financial projection based on a business plan.
 * @param {object} args
 * @param {string} args.business_plan_content - The full text of the business plan.
 * @returns {Promise<object>} A structured financial projection.
 */
export async function generate_financial_projections({ business_plan_content }) {
  console.log("[Business Tools] Generating financial projections...");
  const { object } = await generateObject({
    model: getModel(),
    prompt: `Based on the following business plan, generate a simple 3-year financial projection.
        Focus on:
        -   Revenue Streams (e.g., Subscriptions, Ads)
        -   Cost of Goods Sold (COGS) (e.g., Server Costs, API fees)
        -   Operating Expenses (OpEx) (e.g., Salaries, Marketing)
        -   Net Profit

        Provide a simplified year-over-year table.
        ---
        BUSINESS PLAN:
        ${business_plan_content}`,
    schema: z.object({
      projections: z
        .array(
          z.object({
            year: z.number(),
            revenue: z.string().describe("e.g., $100,000"),
            cogs: z.string().describe("e.g., $20,000"),
            opex: z.string().describe("e.g., $50,000"),
            net_profit: z.string().describe("e.g., $30,000"),
          })
        )
        .length(3),
      summary: z.string().describe("A brief summary of the financial outlook."),
    }),
  });
  return object;
}

/**
 * NEW TOOL: Performs a SWOT and valuation analysis on a business plan.
 * @param {object} args
 * @param {string} args.business_plan_content - The full text of the business plan.
 * @returns {Promise<object>} A structured valuation report.
 */
export async function perform_business_valuation({ business_plan_content }) {
  console.log("[Business Tools] Performing business valuation...");
  const { object } = await generateObject({
    model: getModel(),
    prompt: `You are a business valuator. Analyze the following business plan and perform a SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis.
        Also, provide a qualitative valuation based on market potential, competitive advantage, and risk factors.
        ---
        BUSINESS PLAN:
        ${business_plan_content}`,
    schema: z.object({
      swot_analysis: z.object({
        strengths: z.array(z.string()),
        weaknesses: z.array(z.string()),
        opportunities: z.array(z.string()),
        threats: z.array(z.string()),
      }),
      qualitative_valuation: z
        .string()
        .describe(
          "A paragraph summarizing the business's potential value, key value drivers, and major risks."
        ),
      estimated_value_range: z
        .string()
        .describe(
          "A qualitative or rough quantitative estimate, e.g., 'Pre-seed (<$500k)', 'Seed-Stage ($1M-$5M)', 'High Potential but Unproven'"
        ),
    }),
  });
  return object;
}
