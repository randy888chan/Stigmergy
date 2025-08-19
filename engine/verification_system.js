import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import { getModel } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";

async function extractKeyTerms(content, prompt) {
  const { object } = await generateObject({
    model: getModel(),
    prompt: `${prompt}\n---\nDOCUMENT:\n${content}`,
    schema: z.object({
      terms: z.array(z.string()).describe("A list of 5-10 essential keywords or phrases."),
    }),
  });
  return object.terms;
}

async function verifyCodebaseContains(terms) {
  const files = await glob("src/**/*.{js,ts,jsx,tsx}", { ignore: "node_modules/**" });
  const report = {};
  let foundCount = 0;

  for (const term of terms) {
    let found = false;
    for (const file of files) {
      const content = await fs.readFile(file, "utf-8");
      if (new RegExp(`\\b${term}\\b`, "i").test(content)) {
        report[term] = { found: true, file };
        found = true;
        foundCount++;
        break;
      }
    }
    if (!found) {
      report[term] = { found: false, file: null };
    }
  }
  return { verified: foundCount === terms.length, report };
}

export async function verifyMilestone(milestoneDescription) {
  try {
    console.log(`[Verification] Verifying milestone: ${milestoneDescription}`);
    const prdPath = path.join(process.cwd(), "docs", "prd.md");
    const archPath = path.join(process.cwd(), "docs", "architecture.md");

    if (!(await fs.pathExists(prdPath)) || !(await fs.pathExists(archPath))) {
      return { success: false, details: { error: "Planning documents not found." } };
    }

    const prdContent = await fs.readFile(prdPath, "utf-8");
    const archContent = await fs.readFile(archPath, "utf-8");

    const archTerms = await extractKeyTerms(
      archContent,
      "Extract critical technical keywords, component names, and library names from this architecture document."
    );
    const archVerification = await verifyCodebaseContains(archTerms);

    const prdGoals = await extractKeyTerms(
      prdContent,
      "Extract primary functional goals or user-facing capabilities from this PRD."
    );
    const prdVerification = await verifyCodebaseContains(prdGoals);

    const success = archVerification.verified && prdVerification.verified;
    console.log(`[Verification] Result: ${success ? "PASSED" : "FAILED"}`);

    return {
      success,
      details: {
        milestone: milestoneDescription,
        architectural_compliance: archVerification,
        functional_compliance: prdVerification,
      },
    };
  } catch (error) {
    return { success: false, details: { error: error.message } };
  }
}
