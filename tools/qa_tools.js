import { getCompletion } from '../engine/llm_adapter.js';

/**
 * Performs a semantic review of code against requirements and architecture.
 * @param {object} args - The arguments for the review.
 * @param {string} args.requirements - The requirements for the code.
 * @param {string} args.code - The code to be reviewed.
 * @param {string} args.architecture_plan - The architectural plan.
 * @returns {Promise<object>} - A promise that resolves to the review result.
 */
export async function semantic_review({ requirements, code, architecture_plan }) {
  const persona_prompt = `
You are a meticulous QA engineer. Your task is to review a piece of code based on a set of requirements and an architecture plan.

You must determine if the code meets the requirements and adheres to the architecture.

Your response must be in a specific JSON format. Do not include any other text, just the JSON object.

The JSON format is:
{
  "review_passed": boolean,
  "feedback": "string"
}

If the review fails, the "feedback" string must contain a detailed, constructive critique of the code, explaining why it failed and how it can be improved.

Here is the information for your review:

**Requirements:**
${requirements}

**Architecture Plan:**
${architecture_plan}

**Code to Review:**
\`\`\`
${code}
\`\`\`
`;

  const result = await getCompletion('qa', persona_prompt);
  return result;
}
