const { exec } = require('child_process');
const util = require('util');

const execPromise = util.promisify(exec);

async function execute({ command }) {
  // WARNING: This is a powerful tool. In a production system, you would need
  // heavy sandboxing and security controls. For now, we allow it.
  console.log(`[Shell] Executing: ${command}`);
  try {
    const { stdout, stderr } = await execPromise(command, { cwd: process.cwd() });
    if (stderr) {
      return `STDERR: ${stderr}`;
    }
    return stdout;
  } catch (error) {
    return `EXECUTION FAILED: ${error.message}`;
  }
}

module.exports = {
  execute,
};
