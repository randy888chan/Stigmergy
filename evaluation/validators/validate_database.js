const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const solutionDir = path.join(__dirname, 'temp_solution');

async function main() {
  try {
    // 1. Check if required files exist
    const requiredFiles = ['models/User.js', 'config/database.js'];
    for (const file of requiredFiles) {
      const filePath = path.join(solutionDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`${file} not found in the solution directory.`);
      }
    }

    // 2. Install dependencies (assuming mongoose for this example)
    console.log('Installing dependencies (mongoose)...');
    try {
      // Check if package.json exists, if not, create one
      const packageJsonPath = path.join(solutionDir, 'package.json');
      if (!fs.existsSync(packageJsonPath)) {
        await execPromise('npm init -y', { cwd: solutionDir });
      }
      await execPromise('npm install mongoose', { cwd: solutionDir });
      console.log('Dependencies installed successfully.');
    } catch (error) {
      console.error('Failed to install dependencies:', error.stderr);
      throw new Error('npm install failed.');
    }

    // 3. Attempt to load the modules to check for syntax errors
    console.log('Loading database config and User model...');
    try {
      // We don't want to actually connect, so we might need to mock the connection function
      // For now, just requiring is a good first step.
      require(path.join(solutionDir, 'config/database.js'));
      require(path.join(solutionDir, 'models/User.js'));
      console.log('Modules loaded successfully.');
    } catch (error) {
      throw new Error(`Failed to load modules. Syntax error or runtime issue? ${error.message}`);
    }

    console.log('PASS: Database validation successful (files exist, dependencies install, and modules load).');
    process.exit(0);

  } catch (error) {
    console.error(`FAIL: Database validation failed. ${error.message}`);
    process.exit(1);
  }
}

main();