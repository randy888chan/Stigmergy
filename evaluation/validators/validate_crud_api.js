// Remove all debugging console.log statements to ensure only JSON is output
import { exec, spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : null;
  if (!solutionDir) {
    // This validator MUST be called with a directory argument.
    const errorResult = { success: false, message: 'Validation script must be called with a solution directory path.' };
    console.log(JSON.stringify(errorResult));
    process.exit(1);
  }

  try {
    // 1. Install dependencies
    await new Promise((resolve, reject) => {
      const install = exec('npm install express jest supertest', { cwd: solutionDir });
      install.stdout.on('data', () => {}); // Suppress output
      install.stderr.on('data', () => {}); // Suppress output
      install.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`npm install failed with code ${code}`));
        }
        resolve();
      });
    });

    // 2. Start the server
    const serverPath = path.join(solutionDir, 'server.js');
    if (!fs.existsSync(serverPath)) {
      throw new Error('server.js not found');
    }
    const server = spawn('node', [serverPath], { cwd: solutionDir, detached: true });
    
    let serverReady = false;
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Server running on port 3001') || data.toString().includes('listening on port 3001')) {
        serverReady = true;
      }
    });
    server.stderr.on('data', () => {}); // Suppress output

    // Wait for server to be ready
    let waitTime = 0;
    const maxWaitTime = 10000; // 10 seconds
    const waitInterval = 500; // 500ms intervals
    
    while (!serverReady && waitTime < maxWaitTime) {
      await new Promise((resolve) => setTimeout(resolve, waitInterval));
      waitTime += waitInterval;
    }

    if (!serverReady) {
      // Try to kill the process if it didn't start properly
      try {
        process.kill(-server.pid);
      } catch (e) {
        // Ignore errors when killing process
      }
      throw new Error('Server failed to start within the expected time');
    }

    // 3. Run tests
    const testPath = path.join(solutionDir, 'notes.test.js');
    if (!fs.existsSync(testPath)) {
      throw new Error('notes.test.js not found');
    }

    const testResult = await new Promise((resolve, reject) => {
      const test = exec('npx jest notes.test.js --verbose', { cwd: solutionDir });
      let output = '';
      test.stdout.on('data', (data) => {
        output += data;
      });
      test.stderr.on('data', (data) => {
        output += data;
      });
      test.on('close', (code) => {
        resolve({ code, output });
      });
    });

    // 4. Kill server
    try {
      process.kill(-server.pid);
    } catch (e) {
      // Ignore errors when killing process
    }

    if (testResult.code !== 0) {
      throw new Error(`Jest tests failed with exit code ${testResult.code}:\n${testResult.output}`);
    }

    return {
      success: true,
      message: 'All CRUD API tests passed.',
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
    };
  }
}

// If called directly, run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = process.argv[2] || './temp_solution';
  validate(directory).then(result => {
    // Only output the JSON result, nothing else
    console.log(JSON.stringify(result));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    // Output error as JSON
    console.log(JSON.stringify({ success: false, message: error.message }));
    process.exit(1);
  });
}

export default validate;