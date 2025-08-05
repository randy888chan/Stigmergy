import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

/**
 * Executes a shell command and returns the output.
 * @param {string} command - The command to execute.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runCommand(command) {
  try {
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr };
  } catch (error) {
    console.error(`Error executing command: ${command}`, error);
    throw new Error(`Failed to execute command: ${command}. Stderr: ${error.stderr}`);
  }
}

/**
 * @module git_tool
 * @description A tool for interacting with Git repositories.
 */

/**
 * Stages all changes and commits them with a given message.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.message - The commit message.
 * @returns {Promise<string>} A confirmation message with the commit hash.
 */
export async function commit({ message }) {
  if (!message || message.trim() === "") {
    throw new Error("A non-empty commit message is required.");
  }

  // Stage all changes
  await runCommand("git add .");

  // Commit with the provided message
  // Using environment variables for the commit message is safer against command injection
  const { stdout } = await execAsync(`git commit -m "${message.replace(/"/g, '\\"')}"`);

  return `Successfully committed changes: ${stdout.trim()}`;
}

/**
 * Pushes changes to a remote repository.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.remote - The name of the remote (e.g., 'origin').
 * @param {string} args.branch - The name of the branch (e.g., 'main').
 * @returns {Promise<string>} A confirmation message.
 */
export async function push({ remote = "origin", branch = "main" }) {
  if (!remote || !branch) {
    throw new Error("Both 'remote' and 'branch' are required for push.");
  }
  // Basic validation to prevent command injection
  const validPattern = /^[a-zA-Z0-9_.\-\/]+$/;
  if (!validPattern.test(remote) || !validPattern.test(branch)) {
    throw new Error("Invalid remote or branch name contains unsafe characters.");
  }

  const { stdout, stderr } = await runCommand(`git push ${remote} ${branch}`);

  if (stderr && !stderr.includes("Everything up-to-date")) {
    return `Push completed with warnings: ${stderr}`;
  }

  return `Successfully pushed to ${remote}/${branch}.`;
}
