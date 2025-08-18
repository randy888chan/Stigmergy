import { spawn, execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { GeminiAuthManager } from "./geminiAuthManager.js";
// --- START: ADDITIONS ---
import chalk from "chalk";
import { getCompletion } from "../../engine/llm_adapter.js"; // Import the primary LLM adapter
import config from "../../stigmergy.config.js"; // Import the main config
// --- END: ADDITIONS ---

export class ExternalAgentBridge {
  constructor() {
    this.geminiPath = this.findGeminiPath();
    this.superDesignAPI = "http://localhost:3001"; // As specified for the SuperDesign VS Code extension
    this.geminiAuthManager = new GeminiAuthManager();
  }

  /**
   * Executes a prompt using the Gemini CLI.
   * @param {string} prompt The prompt to send to Gemini.
   * @param {object} context Additional context for the prompt.
   * @returns {Promise<object>} The parsed JSON output from the Gemini CLI.
   */
  async executeWithGemini(prompt, context) {
    // ... (authentication logic remains the same) ...
    const contextString = JSON.stringify(context || {});
    const command = `${this.geminiPath} "${prompt}" --context '${contextString}'`;

    try {
      // --- START: MODIFICATION ---
      // This entire block is wrapped in a try...catch now.
      return new Promise((resolve, reject) => {
        const childProcess = spawn("sh", ["-c", command], { stdio: "pipe" });
        let output = "";
        let errorOutput = "";

        childProcess.stdout.on("data", (data) => {
          output += data.toString();
        });

        childProcess.stderr.on("data", (data) => {
          errorOutput += data.toString();
        });

        childProcess.on("close", (code) => {
          if (code === 0) {
            try {
              resolve(JSON.parse(output));
            } catch (e) {
              reject(
                new Error(
                  `Failed to parse Gemini CLI JSON output. Error: ${e.message}. Output: ${output}`
                )
              );
            }
          } else {
            reject(
              new Error(`Gemini CLI process exited with code ${code}: ${errorOutput || output}`)
            );
          }
        });

        childProcess.on("error", (err) => {
          reject(new Error(`Failed to start Gemini CLI process: ${err.message}`));
        });
      });
      // --- END: MODIFICATION ---
    } catch (error) {
      console.warn(chalk.yellow(`Gemini CLI execution failed. Error: ${error.message}`));
      if (config.fallbacks.execution === "llm-api") {
        console.log(chalk.cyan("Falling back to primary LLM API for execution..."));
        // Re-format the request for a standard LLM call
        const fallbackPrompt = `
                The task was: ${prompt}
                The provided context was: ${JSON.stringify(context, null, 2)}
                Please generate the necessary code or response to fulfill this task.
            `;
        // Delegate to the main LLM adapter
        return getCompletion("dev", fallbackPrompt); // Using @dev persona as a sensible default
      } else {
        throw error; // If fallback is disabled, re-throw the original error.
      }
    }
  }

  /**
   * Generates UI/UX designs using the SuperDesign service.
   * @param {string} prompt The prompt for the design generation.
   * @param {Array} existingDesigns Optional array of existing designs for context.
   * @returns {Promise<object>} The JSON response from the SuperDesign API.
   */
  async generateWithSuperDesign(prompt, existingDesigns = []) {
    try {
      const response = await fetch(`${this.superDesignAPI}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, existingDesigns }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `SuperDesign API request failed with status ${response.status}: ${errorText}`
        );
      }

      return await response.json();
    } catch (error) {
      // --- START: MODIFICATION ---
      console.warn(
        chalk.yellow(`Could not connect to SuperDesign service. Error: ${error.message}`)
      );
      if (config.fallbacks.design === "markdown") {
        console.log(chalk.cyan("Falling back to generating a markdown description of the UI."));
        return {
          fallback: true,
          designs: [
            {
              type: "markdown",
              content: `
# UI Mockup Description (Fallback)

**Prompt:** ${prompt}

*   **Layout:** A standard two-column layout.
*   **Header:** Contains the application title and navigation links.
*   **Main Content:** A list of blog posts with titles and summaries.
*   **Sidebar:** Includes a search bar and a list of categories.

*(Note: This is a text-based fallback because the SuperDesign visualization service was unavailable.)*
              `,
            },
          ],
        };
      } else {
        throw new Error(`Could not connect to SuperDesign service at ${this.superDesignAPI}.`);
      }
      // --- END: MODIFICATION ---
    }
  }

  /**
   * Finds the path to the installed gemini-cli or provides a fallback.
   * @returns {string} The command to execute gemini-cli.
   */
  findGeminiPath() {
    try {
      return execSync("which gemini-cli", { encoding: "utf8" }).trim();
    } catch {
      console.warn(
        '⚠️ Gemini CLI not found in PATH. Using npx fallback. For better performance, install with "npm install -g @google/generative-ai-cli".'
      );
      return "npx @google/generative-ai-cli";
    }
  }
}
