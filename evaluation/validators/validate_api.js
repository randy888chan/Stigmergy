import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');

  let server;
  try {
    // 1. Check if required files exist
    const serverJsPath = path.join(solutionDir, 'server.js');
    if (!fs.existsSync(serverJsPath)) {
      throw new Error('server.js not found in the solution directory.');
    }

    // 2. Install dependencies
    try {
      await execPromise('npm install express axios', { cwd: solutionDir });
    } catch (error) {
      throw new Error('npm install failed.');
    }

    // 3. Start the server
    server = spawn('node', ['server.js'], { cwd: solutionDir, detached: true });

    let serverOutput = '';
    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
    });
    server.stderr.on('data', (data) => {
      serverOutput += data.toString();
    });

    // Wait for server to start
    let serverReady = false;
    let waitTime = 0;
    const maxWaitTime = 10000; // 10 seconds
    const waitInterval = 500; // 500ms intervals
    
    while (!serverReady && waitTime < maxWaitTime) {
      if (serverOutput.includes('Server running') || serverOutput.includes('listening')) {
        serverReady = true;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, waitInterval));
      waitTime += waitInterval;
    }

    if (!serverReady) {
      throw new Error('Server failed to start within the expected time');
    }

    // 4. Make a request to the server
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

    // 6. Kill server
    try {
      process.kill(-server.pid);
    } catch (e) {
      // Ignore errors when killing process
    }

    return {
      success: true,
      message: 'API validation successful.'
    };

  } catch (error) {
    // Kill server if it's still running
    if (server) {
      try {
        process.kill(-server.pid);
      } catch (e) {
        // Ignore errors when killing process
      }
    }
    
    return {
      success: false,
      message: `API validation failed: ${error.message}`
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