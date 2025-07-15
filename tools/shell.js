const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

// A global allowlist of command prefixes for an initial layer of safety.
// The primary security check is the agent-specific permission in tool_executor.js.
const GLOBAL_COMMAND_PREFIX_ALLOWLIST = [
  'ls',
  'git',
  'npm',
  'node',
];

function isCommandGloballyAllowed(command) {
  return GLOBAL_COMMAND_PREFIX_ALLOWLIST.some(prefix => command.trim().startsWith(prefix));
}

async function execute({ command }) {
  if (!command) {
    throw new Error("No command provided to shell tool.");
  }

  // First-level sanity check.
  if (!isCommandGloballyAllowed(command)) {
      throw new Error(`Command "${command}" is not in the global command prefix allowlist. This is a safety mechanism.`);
  }

  console.log(`[Shell] Executing: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr && !stdout) {
        // If there's only stderr, it's likely a real error.
        throw new Error(stderr);
    }
    // Many tools use stderr for progress, so we return both if stdout exists.
    return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
  } catch (error) {
    // This will catch exec errors and explicit throws.
    return `EXECUTION FAILED: ${error.message}`;
  }
}

module.exports = {
  execute,
};
