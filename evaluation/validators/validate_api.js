const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test the API implementation
try {
  // Check if required files exist
  const requiredFiles = ['server.js', 'routes/users.js'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '../temp_solution', file))) {
      console.error(`FAIL: ${file} file not found`);
      process.exit(1);
    }
  }

  // Start the server
  const serverPath = path.join(__dirname, '../temp_solution/server.js');
  const server = spawn('node', [serverPath], {
    cwd: path.join(__dirname, '../temp_solution'),
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let serverOutput = '';
  server.stdout.on('data', (data) => {
    serverOutput += data.toString();
  });

  server.stderr.on('data', (data) => {
    serverOutput += data.toString();
  });

  // Wait for server to start or fail
  setTimeout(() => {
    if (server.exitCode !== null) {
      console.error(`FAIL: Server failed to start. Exit code: ${server.exitCode}`);
      console.error(`Server output: ${serverOutput}`);
      process.exit(1);
    }

    // If server is still running, try to make a request
    const http = require('http');
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/users',
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`FAIL: GET /api/users returned status ${res.statusCode}`);
          server.kill();
          process.exit(1);
        }
        
        try {
          const users = JSON.parse(data);
          
          if (!Array.isArray(users)) {
            console.error('FAIL: GET /api/users should return an array');
            server.kill();
            process.exit(1);
          }
          
          // Check if users have required properties
          for (const user of users) {
            if (!user.id || !user.name || !user.email) {
              console.error('FAIL: Each user should have id, name, and email properties');
              server.kill();
              process.exit(1);
            }
          }
          
          console.log('PASS: API validation passed');
          server.kill();
          process.exit(0);
        } catch (parseError) {
          console.error(`FAIL: Failed to parse JSON response: ${parseError.message}`);
          server.kill();
          process.exit(1);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error(`FAIL: Request failed: ${error.message}`);
      server.kill();
      process.exit(1);
    });
    
    req.end();
  }, 5000); // Wait 5 seconds for server to start

  // Kill server after 10 seconds if no response
  setTimeout(() => {
    console.error('FAIL: Server did not respond in time');
    server.kill();
    process.exit(1);
  }, 10000);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}