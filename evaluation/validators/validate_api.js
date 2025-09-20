import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');
  console.log(`[Validator] Starting validation in ${solutionDir}`);

  let server;
  try {
    // 1. Check if required files exist
    const serverJsPath = path.join(solutionDir, 'server.js');
    if (!fs.existsSync(serverJsPath)) {
      throw new Error('server.js not found in the solution directory.');
    }

    // 2. Install dependencies
    // Note: We install dependencies here directly because the validator runs in a separate
    // temporary directory for each problem, and doesn't have access to the root node_modules.
    console.log('Installing dependencies (express and axios)...');
    try {
      await execPromise('npm install express axios', { cwd: solutionDir });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Failed to install dependencies:', error.stderr);
      throw new Error('npm install failed.');
    }

    // 3. Start the server
    console.log('Starting the server...');
    server = spawn('node', ['server.js'], { cwd: solutionDir, detached: true });

    let serverOutput = '';
    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
      console.log(`[Server STDOUT]: ${data}`);
    });
    server.stderr.on('data', (data) => {
      serverOutput += data.toString();
      console.error(`[Server STDERR]: ${data}`);
    });

    // Wait for server to start with improved logic
    let serverReady = false;
    let waitTime = 0;
    const maxWaitTime = 10000; // 10 seconds
    const waitInterval = 500; // 500ms intervals
    
    while (!serverReady && waitTime < maxWaitTime) {
      if (serverOutput.includes('Server running') || serverOutput.includes('listening')) {
        serverReady = true;
        console.log('[Validator] Server is ready.');
        break;
      }
      await new Promise(resolve => setTimeout(resolve, waitInterval));
      waitTime += waitInterval;
    }

    if (!serverReady) {
      throw new Error('Server failed to start within the expected time');
    }

    // 4. Make a request to the server
    console.log('Making a GET request to /api/users...');
    // We need to construct the path to the installed axios module
    const axiosPath = path.join(solutionDir, 'node_modules', 'axios');
    const { default: axios } = await import(axiosPath);
    const response = await axios.get('http://localhost:3000/api/users');

    // 5. Validate the response
    if (response.status !== 200) {
      throw new Error(`Expected status 200 OK, but got ${response.status}`);
    }

    const users = response.data;
    if (!Array.isArray(users)) {
      throw new Error('Response body should be a JSON array of users.');
    }

    if (users.length === 0) {
      console.log('Warning: The users array is empty, but the API is working.');
    } else {
      const user = users[0];
      if (!user.id || !user.name || !user.email) {
        throw new Error('Each user object must have id, name, and email properties.');
      }
    }

    console.log('PASS: API validation successful.');
    return {
      success: true,
      message: 'API validation successful.'
    };

  } catch (error) {
    console.error(`FAIL: API validation failed. ${error.message}`);
    return {
      success: false,
      message: `API validation failed: ${error.message}`
    };
  } finally {
    if (server) {
      try {
        process.kill(-server.pid);
        console.log('[Validator] Server process killed.');
      } catch (e) {
        console.error(`[Validator] Failed to kill server process: ${e.message}`);
      }
    }
  }
}

// If called directly, run validation
if (import.meta.url === `file://${process.argv[1]}`) {
  const directory = process.argv[2] || './temp_solution';
  validate(directory).then(result => {
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  }).catch(error => {
    console.error(`[Validator] Unexpected error: ${error.message}`);
    process.exit(1);
  });
}

export default validate;