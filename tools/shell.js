const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function execute({ command }) {
  // WARNING: This is a powerful tool. In a production system, you would need
  // heavy sandboxing and security controls. For now, we allow it for local dev.
  if (!command) {
      throw new Error("No command provided to shell tool.");
  }
  console.log(`[Shell] Executing: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr) {
      // Many tools (like git) use stderr for progress messages, so we return both.
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
