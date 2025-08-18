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
