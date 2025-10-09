import { exec } from "child_process";
import { promisify } from "util";

/**
 * Executes a shell command in a specified directory.
 * @param {object} args - The arguments for the function.
 * @param {string} args.command - The command to execute.
 * @param {string} [args.cwd] - The current working directory for the command.
 * @returns {Promise<string>} The stdout of the command or an error message.
 */
export async function execute({ command, cwd }) {
  // Promisify is called inside the function to ensure it wraps the mocked version
  // of `exec` during tests, rather than the real one at module load time.
  const execPromise = promisify(exec);

  if (!command) {
    return "EXECUTION FAILED: No command provided.";
  }

  try {
    const { stdout, stderr } = await execPromise(command, { timeout: 5000, cwd });

    if (stderr) {
      return `EXECUTION FINISHED WITH STDERR: ${stderr.trim()}`;
    }
    
    return stdout.trim();
  } catch (error) {
    if (error.message.includes('timed out')) {
      return `EXECUTION FAILED: Command execution timed out after 5 seconds`;
    }
    if (error.stderr) {
      return `EXECUTION FAILED: ${error.stderr.trim()}`;
    }
    return `EXECUTION FAILED: ${error.message}`;
  }
}