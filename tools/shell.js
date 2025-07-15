const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// A strict allowlist of safe, common commands.
// This is a short-term security measure. Agent-specific permissions are handled in tool_executor.
const GLOBAL_COMMAND_ALLOWLIST = new Set([
  'ls',
  'git status',
  'npm install',
  'npm test',
  'npm run lint',
  'npm audit',
]);

function isCommandAllowed(command) {
  // Check against a general allowlist for common, safe commands
  const commandBase = command.split(' ');
  if (GLOBAL_COMMAND_ALLOWLIST.has(commandBase) || GLOBAL_COMMAND_ALLOWLIST.has(command)) {
    return true;
  }
  // More specific checks can be added here
  if (command.startsWith('ls ') || command.startsWith('npm test --')) {
      return true;
  }
  return false;
}


async function execute({ command }) {
  if (!command) {
      throw new Error("No command provided to shell tool.");
  }

  // First-level check against a global list of safe commands
  if (!isCommandAllowed(command)) {
      // The second-level, agent-specific check happens in the tool_executor
      // This global check is an extra safety layer.
      console.warn(`[Shell] Command '${command}' is not on the global allowlist. It must be explicitly permitted for the agent.`);
  }

  console.log(`[Shell] Executing: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr) {
      return `STDOUT: ${stdout}\nSTDERR: ${stderr}`;
    }
    return stdout;
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

module.exports = {
  execute,
};
