import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');
  console.log(`[Validator] Starting validation in ${solutionDir}`);

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
      const configPath = path.join(solutionDir, 'config/database.js');
      const modelPath = path.join(solutionDir, 'models/User.js');
      await import(`file://${configPath}`);
      await import(`file://${modelPath}`);
      console.log('Modules loaded successfully.');
    } catch (error) {
      throw new Error(`Failed to load modules. Syntax error or runtime issue? ${error.message}`);
    }

    console.log('PASS: Database validation successful (files exist, dependencies install, and modules load).');
    return {
      success: true,
      message: 'Database validation successful (files exist, dependencies install, and modules load).'
    };

  } catch (error) {
    console.error(`FAIL: Database validation failed. ${error.message}`);
    return {
      success: false,
      message: `Database validation failed: ${error.message}`
    };
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