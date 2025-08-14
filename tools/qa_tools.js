import { getLlm } from "../engine/llm_adapter.js";

/**
 * Performs a semantic review of code against requirements using an LLM.
 * @param {string} requirements - The requirements for the code.
 * @param {string} code - The code to be reviewed.
 * @returns {Promise<{review_passed: boolean, feedback: string}>} An object containing the review result and feedback.
 * @description This tool uses an LLM to perform a semantic review of code to ensure it meets the given requirements.
 */
export async function semantic_review({ requirements, code }) {
  const llm = getLlm();
  const prompt = `
        As an expert QA engineer, your task is to perform a semantic review of the provided code against the given requirements.

        **Requirements:**
        ${requirements}

        **Code:**
        \`\`\`
        ${code}
        \`\`\`

        **Your analysis should answer the following questions:**
        1. Does the code semantically fulfill the requirements?
        2. Are there any obvious bugs or edge cases that were missed?
        3. Is the code of high quality (e.g., readable, maintainable)?

        **Output Format:**
        Provide your response as a JSON object with two keys:
        - "review_passed": a boolean (true if the code passes, false otherwise).
        - "feedback": a string containing your detailed feedback and reasoning. If the review fails, provide specific, actionable feedback for the developer.

        **Example of a passing review:**
        {
            "review_passed": true,
            "feedback": "The code correctly implements the requirements. It is well-structured and handles edge cases appropriately."
        }

        **Example of a failing review:**
        {
            "review_passed": false,
            "feedback": "The code does not fully meet the requirements. The requirement for user authentication is missing. Additionally, the error handling for invalid input is not robust."
        }

        Now, provide your review of the given code and requirements.
    `;

  try {
    const response = await llm.completion({ prompt, format: "json" });
    const review = JSON.parse(response);
    return review;
  } catch (error) {
    console.error(`Error in semantic_review: ${error.message}`);
    return {
      review_passed: false,
      feedback: `An error occurred during the semantic review: ${error.message}`,
    };
  }
}
