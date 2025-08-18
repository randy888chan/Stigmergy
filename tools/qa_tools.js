import { getModel } from "../engine/llm_adapter.js";
import { generateObject } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Performs a semantic review of code against requirements.
 * @param {object} args - The arguments for the review.
 * @param {string} args.requirements - The requirements for the code.
 * @param {string} args.code - The code to be reviewed.
 * @returns {Promise<object>} - A promise that resolves to the review result.
 */
export async function verify_requirements({ requirements, code }) {
  console.log("[QA Tools] Verifying code against requirements...");
  const { object } = await generateObject({
    model: getModel(),
    prompt: `You are a QA engineer. Does the following code fully satisfy all stated requirements? Respond with a boolean and concise feedback.
    ---
    **Requirements:** ${requirements}
    ---
    **Code:**
    \`\`\`
    ${code}
    \`\`\`
    `,
    schema: z.object({
      passed: z.boolean(),
      feedback: z.string(),
    }),
  });
  return object;
}

/**
 * NEW TOOL: Checks code against the architectural blueprint.
 * @param {object} args
 * @param {string} args.architecture_blueprint - The YAML content of the blueprint.
 * @param {string} args.code - The code to be reviewed.
 * @returns {Promise<object>}
 */
export async function verify_architecture({ architecture_blueprint, code }) {
  console.log("[QA Tools] Verifying code against architecture blueprint...");
  const { object } = await generateObject({
    model: getModel(),
    prompt: `You are a solutions architect. Does the provided code adhere to the principles and components defined in the architecture blueprint? Pay close attention to the specified tech stack, data models, and component responsibilities.
        ---
        **Architecture Blueprint:**
        \`\`\`yaml
        ${architecture_blueprint}
        \`\`\`
        ---
        **Code:**
        \`\`\`
        ${code}
        \`\`\`
        `,
    schema: z.object({
      passed: z.boolean(),
      feedback: z.string(),
    }),
  });
  return object;
}

/**
 * NEW TOOL: Runs unit tests and checks for sufficient coverage.
 * @param {object} args
 * @param {string} args.test_command - The shell command to run tests (e.g., "npm test").
 * @param {number} args.required_coverage - The minimum acceptable test coverage percentage.
 * @returns {Promise<object>}
 */
export async function run_tests_and_check_coverage({
  test_command = "npm test -- --coverage",
  required_coverage = 80,
}) {
  console.log(`[QA Tools] Running tests with command: ${test_command}`);
  try {
    const { stdout, stderr } = await execPromise(test_command);

    if (stderr && !stderr.toLowerCase().includes("pass")) {
      return {
        passed: false,
        feedback: `Tests failed. Stderr: ${stderr.substring(0, 500)}`,
        coverage: 0,
      };
    }

    // A simple regex to find the coverage summary line from Jest's output
    const coverageRegex = /All files\s*\|\s*([\d.]+)/;
    const match = stdout.match(coverageRegex);
    const coverage = match ? parseFloat(match[1]) : 0;

    if (coverage >= required_coverage) {
      return {
        passed: true,
        feedback: `All tests passed with ${coverage}% coverage.`,
        coverage: coverage,
      };
    } else {
      return {
        passed: false,
        feedback: `Tests passed, but coverage of ${coverage}% is below the required ${required_coverage}%.`,
        coverage: coverage,
      };
    }
  } catch (error) {
    return {
      passed: false,
      feedback: `Test execution failed: ${error.message.substring(0, 500)}`,
      coverage: 0,
    };
  }
}
