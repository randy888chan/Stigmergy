import { getModel } from "../engine/llm_adapter.js";
import { generateObject } from "ai";
import { z } from "zod";
import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

export async function verify_requirements({ requirements, code }) {
  const { object } = await generateObject({
    model: getModel(),
    prompt: `Does the code satisfy all requirements? Respond with a boolean and feedback. Requirements: ${requirements}\n\nCode: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function verify_architecture({ architecture_blueprint, code }) {
  const { object } = await generateObject({
    model: getModel(),
    prompt: `Does the code adhere to the blueprint? Blueprint: ${architecture_blueprint}\n\nCode: ${code}`,
    schema: z.object({ passed: z.boolean(), feedback: z.string() }),
  });
  return object;
}

export async function run_tests_and_check_coverage({
  test_command = "npm test -- --coverage",
  required_coverage = 80,
}) {
  try {
    const { stdout } = await execPromise(test_command);
    const coverageRegex = /All files\s*\|\s*([\d.]+)/;
    const match = stdout.match(coverageRegex);
    const coverage = match ? parseFloat(match[1]) : 0;
    if (coverage >= required_coverage) {
      return { passed: true, feedback: `Tests passed with ${coverage}% coverage.` };
    }
    return {
      passed: false,
      feedback: `Coverage of ${coverage}% is below the required ${required_coverage}%.`,
    };
  } catch (error) {
    return { passed: false, feedback: `Test execution failed: ${error.message}` };
  }
}
