import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { getModel } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";

/**
 * Extracts key technical terms and components from an architecture document.
 * @param {string} architectureContent - The content of the architecture.md file.
 * @returns {Promise<string[]>} A list of key terms.
 */
async function extractArchitectureTerms(architectureContent) {
  const { object } = await generateObject({
    model: getModel(),
    prompt: `Extract the most critical and specific technical keywords, component names, function names, and library names from the following architecture document. Focus on concrete nouns.
        ---
        DOCUMENT:
        ${architectureContent}`,
    schema: z.object({
      terms: z.array(z.string()).describe("A list of 5-10 essential technical terms."),
    }),
  });
  return object.terms;
}

/**
 * Extracts key functional requirements from a PRD.
 * @param {string} prdContent - The content of the prd.md file.
 * @returns {Promise<string[]>} A list of key requirements.
 */
async function extractPrdGoals(prdContent) {
  const { object } = await generateObject({
    model: getModel(),
    prompt: `From the following Product Requirements Document (PRD), extract the primary functional goals. Each goal should be a short phrase describing a user-facing capability.
        ---
        DOCUMENT:
        ${prdContent}`,
    schema: z.object({
      goals: z.array(z.string()).describe("A list of 3-5 primary functional goals."),
    }),
  });
  return object.goals;
}

/**
 * Scans the codebase to verify the presence of specified terms.
 * @param {string[]} terms - A list of terms to search for.
 * @returns {Promise<{verified: boolean, report: object}>} The verification result.
 */
async function verifyCodebaseContains(terms) {
  const files = await glob("src/**/*.{js,ts,jsx,tsx}", { ignore: "node_modules/**" });
  const report = {};
  let foundCount = 0;

  for (const term of terms) {
    let found = false;
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      // Use a case-insensitive regex to find the term as a whole word
      if (new RegExp(`\\b${term}\\b`, "i").test(content)) {
        report[term] = { found: true, file: file };
        found = true;
        foundCount++;
        break; // Move to the next term once found
      }
    }
    if (!found) {
      report[term] = { found: false, file: null };
    }
  }

  return {
    verified: foundCount === terms.length,
    report: report,
  };
}

/**
 * Verifies a project milestone against its planning documents.
 * @param {string} milestoneDescription - A description of the milestone being verified.
 * @returns {Promise<{success: boolean, details: object}>}
 */
export async function verifyMilestone(milestoneDescription) {
  try {
    console.log(`[Verification] Verifying milestone: ${milestoneDescription}`);
    const prdPath = path.join(process.cwd(), "docs", "prd.md");
    const archPath = path.join(process.cwd(), "docs", "architecture.md");

    if (!(await fs.pathExists(prdPath)) || !(await fs.pathExists(archPath))) {
      return {
        success: false,
        details: { error: "Planning documents (prd.md or architecture.md) not found." },
      };
    }

    const prdContent = await fs.readFile(prdPath, "utf-8");
    const archContent = await fs.readFile(archPath, "utf-8");

    // Step 1: Verify architectural compliance
    const archTerms = await extractArchitectureTerms(archContent);
    console.log("[Verification] Checking for architecture terms:", archTerms);
    const archVerification = await verifyCodebaseContains(archTerms);

    // Step 2: Verify functional compliance (simplified check)
    const prdGoals = await extractPrdGoals(prdContent);
    console.log("[Verification] Checking for PRD goals:", prdGoals);
    const prdVerification = await verifyCodebaseContains(prdGoals);

    const success = archVerification.verified && prdVerification.verified;

    console.log(`[Verification] Result: ${success ? "PASSED" : "FAILED"}`);

    return {
      success: success,
      details: {
        milestone: milestoneDescription,
        architectural_compliance: archVerification,
        functional_compliance: prdVerification,
      },
    };
  } catch (error) {
    console.error(
      `[Verification] An unexpected error occurred during verification: ${error.message}`
    );
    return { success: false, details: { error: error.message } };
  }
}
