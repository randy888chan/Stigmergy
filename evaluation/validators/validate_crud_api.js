const { exec, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function validate(directory) {
  const solutionDir = path.resolve(directory);
  console.log(`[Validator] Starting validation in ${solutionDir}`);

  try {
    // 1. Install dependencies
    console.log('[Validator] Installing dependencies...');
    await new Promise((resolve, reject) => {
      const install = exec('npm install express jest supertest', { cwd: solutionDir });
      install.stdout.on('data', (data) => console.log(`[npm install stdout] ${data}`));
      install.stderr.on('data', (data) => console.error(`[npm install stderr] ${data}`));
      install.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`npm install failed with code ${code}`));
        }
        console.log('[Validator] Dependencies installed.');
        resolve();
      });
    });

    // 2. Start the server
    console.log('[Validator] Starting server...');
    const serverPath = path.join(solutionDir, 'server.js');
    if (!fs.existsSync(serverPath)) {
      throw new Error('server.js not found');
    }
    const server = spawn('node', [serverPath], { cwd: solutionDir, detached: true });
    console.log(`[Validator] Server process started with PID: ${server.pid}`);

    let serverReady = false;
    server.stdout.on('data', (data) => {
      console.log(`[Server STDOUT] ${data}`);
      if (data.toString().includes('Server running on port 3001')) {
        console.log('[Validator] Server is ready.');
        serverReady = true;
      }
    });
    server.stderr.on('data', (data) => {
      console.error(`[Server STDERR] ${data}`);
    });

    // Wait for server to be ready
    console.log('[Validator] Waiting for server to become ready...');
    await new Promise((resolve) => setTimeout(resolve, 5000)); // Increased wait time

    if (!serverReady) {
      console.error('[Validator] Server did not become ready in time.');
    }

    // 3. Run tests
    console.log('[Validator] Running tests...');
    const testPath = path.join(solutionDir, 'notes.test.js');
    if (!fs.existsSync(testPath)) {
      throw new Error('notes.test.js not found');
    }

    const testResult = await new Promise((resolve, reject) => {
      const test = exec('npx jest notes.test.js', { cwd: solutionDir });
      let output = '';
      test.stdout.on('data', (data) => {
        console.log(`[Jest STDOUT] ${data}`);
        output += data;
      });
      test.stderr.on('data', (data) => {
        console.error(`[Jest STDERR] ${data}`);
        output += data;
      });
      test.on('close', (code) => {
        console.log(`[Validator] Jest tests finished with code: ${code}`);
        resolve({ code, output });
      });
    });

    // 4. Kill server
    console.log(`[Validator] Killing server process ${server.pid}...`);
    try {
      process.kill(-server.pid);
      console.log('[Validator] Server process killed.');
    } catch (e) {
      console.error(`[Validator] Failed to kill server process: ${e.message}`);
    }


    if (testResult.code !== 0) {
      throw new Error(`Jest tests failed with exit code ${testResult.code}:\n${testResult.output}`);
    }

    console.log('[Validator] Validation successful.');
    return {
      success: true,
      message: 'All CRUD API tests passed.',
    };
  } catch (error) {
    console.error(`[Validator] Validation failed: ${error.message}`);
    return {
      success: false,
      message: error.message,
    };
  }
}

module.exports = validate;
