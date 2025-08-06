import { spawn, execSync } from "child_process";
import fs from "fs-extra";
import path from "path";
import { GeminiAuthManager } from "./geminiAuthManager.js";

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
    await this.geminiAuthManager.ensureAuthenticated();
    // Note: Using 'sh -c' with concatenated strings can be risky.
    // This implementation follows the user's prompt; sanitize inputs in a real-world scenario.
    const contextString = JSON.stringify(context || {});
    const command = `${this.geminiPath} "${prompt}" --context '${contextString}'`;

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
      // Handles network errors or if the service isn't running
      throw new Error(
        `Could not connect to SuperDesign service at ${this.superDesignAPI}. Ensure the extension is running. Error: ${error.message}`
      );
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
