import { exec } from "child_process";
import { promisify } from "util";

const defaultExecPromise = promisify(exec);

export async function execute({ command, agentConfig, execPromise = defaultExecPromise }) {
  if (!command) return "EXECUTION FAILED: No command provided.";
  
  // Security check: only allow permitted commands
  const permitted = (agentConfig.permitted_shell_commands || []).some((p) =>
    new RegExp("^" + p.replace(/\*/g, ".*") + "$").test(command)
  );
  
  if (!permitted)
    return `EXECUTION FAILED: Security policy violation: Command "${command}" not permitted for @${agentConfig.alias}.`;

  try {
    // Execute the command with a timeout
    const { stdout, stderr } = await execPromise(command, { timeout: 5000 });
    
    // Return the output
    return stdout.trim();
  } catch (error) {
    // Handle timeout errors specifically
    if (error.message.includes('timed out')) {
      return `EXECUTION FAILED: Command execution timed out after 5 seconds`;
    }
    // Handle other execution errors
    if (error.stderr) {
      return `EXECUTION FAILED: ${error.stderr.trim()}`;
    }
    return `EXECUTION FAILED: ${error.message}`;
  }
}
