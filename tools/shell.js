import { exec } from "child_process";
import { promisify } from "util";

const execPromise = promisify(exec);
export async function execute({ command, agentConfig }) {
  if (!command) throw new Error("No command provided.");
  const permitted = (agentConfig.permitted_shell_commands || []).some((p) =>
    new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(command)
  );
  if (!permitted)
    throw new Error(
      `Security policy violation: Command "${command}" not permitted for @${agentConfig.alias}.`
    );
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}
