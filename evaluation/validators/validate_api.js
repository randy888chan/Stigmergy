const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

const solutionDir = path.join(__dirname, 'temp_solution');

async function main() {
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
    server = spawn('node', ['server.js'], { cwd: solutionDir });

    let serverOutput = '';
    server.stdout.on('data', (data) => {
      serverOutput += data.toString();
      console.log(`[Server STDOUT]: ${data}`);
    });
    server.stderr.on('data', (data) => {
      serverOutput += data.toString();
      console.error(`[Server STDERR]: ${data}`);
    });

    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for server to start

    // 4. Make a request to the server
    console.log('Making a GET request to /api/users...');
    // We need to construct the path to the installed axios module
    const axiosPath = path.join(solutionDir, 'node_modules', 'axios');
    const axios = require(axiosPath);
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
    process.exit(0);

  } catch (error) {
    console.error(`FAIL: API validation failed. ${error.message}`);
    process.exit(1);
  } finally {
    if (server) {
      server.kill();
    }
  }
}

main();