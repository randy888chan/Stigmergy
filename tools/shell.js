const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

/**
 * Executes a shell command, but only if it's permitted for the calling agent.
 * @param {object} args - The arguments object.
 * @param {string} args.command - The command to execute.
 * @param {object} args.agentConfig - The configuration of the agent calling the tool.
 * @returns {Promise<string>} The STDOUT and STDERR from the command.
 */
async function execute({ command, agentConfig }) {
  if (!command) {
    throw new Error("No command provided to shell tool.");
  }

  const permittedCommands = agentConfig.permitted_shell_commands || [];
  const isPermitted = permittedCommands.some(pattern => {
    // Convert wildcard to regex
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(command);
  });

  if (!isPermitted) {
    throw new Error(`Security policy violation: Command "${command}" is not permitted for agent @${agentConfig.alias}.`);
  }

  console.log(`[Shell] Executing permitted command: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr && !stdout.trim()) {
        // Some tools like npm install log to stderr on success
        if (!stderr.toLowerCase().includes('warn')) {
             throw new Error(stderr);
        }
    }
    return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

module.exports = {
  execute,
};
