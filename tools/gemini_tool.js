import { execFile } from "child_process";
import { promisify } from "util";
import chalk from "chalk";

const execFilePromise = promisify(execFile);

/**
 * Executes a prompt using the local Gemini CLI.
 * @param {object} args
 * @param {string} args.prompt - The prompt to send to Gemini.
 * @returns {Promise<string>} The response from Gemini.
 */
export async function query({ prompt }) {
  if (!prompt) {
    throw new Error("Prompt is required for gemini.query");
  }

  try {
    console.log(chalk.blue(`[Gemini Tool] Sending prompt to CLI...`));
    // Use execFile to avoid shell injection vulnerabilities
    const { stdout, stderr } = await execFilePromise("gemini", [prompt], { timeout: 30000 });

    if (stderr && !stdout) {
      return `Gemini CLI Error: ${stderr.trim()}`;
    }

    return stdout.trim();
  } catch (error) {
    console.error(chalk.red(`[Gemini Tool] Execution failed:`), error.message);
    return `Gemini CLI Failed: ${error.message}`;
  }
}

/**
 * Checks if the Gemini CLI is installed and configured.
 * @returns {Promise<object>} Health status.
 */
export async function health_check() {
  try {
    await execFilePromise("gemini", ["--version"], { timeout: 5000 });
    return { status: "ok", message: "Gemini CLI is installed and responsive." };
  } catch (error) {
    return { status: "error", message: `Gemini CLI not found or not working: ${error.message}` };
  }
}
