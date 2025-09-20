// Add debugging at the top of the file
console.log('[Validator] Starting CRUD API validation script');
console.log('[Validator] process.argv:', process.argv);
console.log('[Validator] import.meta.url:', import.meta.url);

import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');
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
      if (data.toString().includes('Server running on port 3001') || data.toString().includes('listening on port 3001')) {
        console.log('[Validator] Server is ready.');
        serverReady = true;
      }
    });
    server.stderr.on('data', (data) => {
      console.error(`[Server STDERR] ${data}`);
    });

    // Wait for server to be ready
    console.log('[Validator] Waiting for server to become ready...');
    let waitTime = 0;
    const maxWaitTime = 10000; // 10 seconds
    const waitInterval = 500; // 500ms intervals
    
    while (!serverReady && waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, waitInterval));
      waitTime += waitInterval;
    }

    if (!serverReady) {
      console.error('[Validator] Server did not become ready in time.');
      // Try to kill the process if it didn't start properly
      try {
        process.kill(-server.pid);
      } catch (e) {
        console.error(`[Validator] Failed to kill server process: ${e.message}`);
      }
      throw new Error('Server failed to start within the expected time');
    }

    // 3. Run tests
    console.log('[Validator] Running tests...');
    const testPath = path.join(solutionDir, 'notes.test.js');
    if (!fs.existsSync(testPath)) {
      throw new Error('notes.test.js not found');
    }

    const testResult = await new Promise((resolve, reject) => {
      const test = exec('npx jest notes.test.js --verbose', { cwd: solutionDir });
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

// If called directly, run validation
console.log('[Validator] Checking if script is called directly');
console.log('[Validator] import.meta.url:', import.meta.url);
console.log('[Validator] process.argv[1]:', process.argv[1]);

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('[Validator] Script is called directly, running validation');
  const directory = process.argv[2] || './temp_solution';
  validate(directory).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(`[Validator] Unexpected error: ${error.message}`);
    process.exit(1);
  });
} else {
  console.log('[Validator] Script is imported as module');
}

export default validate;