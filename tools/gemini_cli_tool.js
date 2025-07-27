const { spawn } = require('child_process');
const path = require('path');

async function execute({ prompt, projectPath }) {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;

    // Use the locally installed gemini executable from node_modules
    const geminiExecutable = path.resolve(process.cwd(), 'node_modules', '.bin', 'gemini');
    const args = ['-p', prompt, '--yolo', '--project-path', projectPath];

    const spawnOptions = {
      cwd: projectPath,
      env: { ...process.env },
      shell: true
    };

    // If an API key is provided, use it. Otherwise, let the CLI use default credentials.
    if (apiKey) {
      spawnOptions.env.GOOGLE_API_KEY = apiKey;
    }

    console.log(`[Gemini Tool] Executing command in ${projectPath}...`);
    const child = spawn(geminiExecutable, args, spawnOptions);

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => { stdout += data.toString(); });
    child.stderr.on('data', (data) => { stderr += data.toString(); });

    child.on('close', (code) => {
      if (code !== 0) {
        console.error(`[Gemini Tool] Error. Code: ${code}, Stderr: ${stderr}`);
        return reject(new Error(`Gemini CLI exited with code ${code}: ${stderr}`));
      }
      resolve(stdout.trim());
    });

    child.on('error', (err) => {
      console.error('[Gemini Tool] Failed to start process.', err);
      reject(err);
    });
  });
}

module.exports = {
  execute,
};
