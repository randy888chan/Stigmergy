import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);

/**
 * Rebuilds the dashboard by running the 'build:dashboard' script.
 * This tool should be used by agents after they have modified dashboard SOURCE files (e.g., in /dashboard/src).
 * @returns {Promise<string>} The result of the build process.
 */
export async function rebuild_dashboard() {
  try {
    console.log('[Build Tool] Rebuilding dashboard...');
    const { stdout, stderr } = await execPromise('bun run build:dashboard');

    if (stderr) {
      return `Dashboard rebuild finished with warnings: ${stderr}`;
    }

    return `Dashboard rebuilt successfully. Output: ${stdout}`;
  } catch (error) {
    return `EXECUTION FAILED: Dashboard rebuild failed: ${error.message}`;
  }
}