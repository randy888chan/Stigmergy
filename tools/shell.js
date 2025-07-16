const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function execute({ command }) {
  if (!command) {
    throw new Error("No command provided to shell tool.");
  }

  // Explicitly block git push for safety
  if (/\bgit\s+push\b/.test(command)) {
    throw new Error("Security policy violation: The 'git push' command is forbidden for autonomous agents.");
  }

  console.log(`[Shell] Executing: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr && !stdout.trim()) {
        throw new Error(stderr);
    }
    return `STDOUT:\n${stdout}\n\nSTDERR:\n${stderr}`;
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

module.exports = {
  execute,
};
