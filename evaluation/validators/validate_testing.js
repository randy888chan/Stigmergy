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
    const requiredFiles = ['__tests__/calculator.test.js', 'calculator.js'];
    for (const file of requiredFiles) {
        const filePath = path.join(solutionDir, file);
        if (!fs.existsSync(filePath)) {
            throw new Error(`${file} not found in the solution directory.`);
        }
    }

    // 2. Install dependencies
    console.log('Installing dependencies (jest)...');
    try {
        const packageJsonPath = path.join(solutionDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            await execPromise('npm init -y', { cwd: solutionDir });
        }
        await execPromise('npm install jest', { cwd: solutionDir });
        console.log('Dependencies installed successfully.');
    } catch (error) {
        console.error('Failed to install dependencies:', error.stderr);
        throw new Error('npm install failed.');
    }

    // 3. Run the tests with Jest
    console.log('Running tests with Jest...');
    try {
        const jestPath = path.join(solutionDir, 'node_modules/.bin/jest');
        const { stdout, stderr } = await execPromise(`${jestPath} --coverage`, { cwd: solutionDir });
        console.log('Jest stdout:', stdout);
        if (stderr) {
            console.error('Jest stderr:', stderr);
        }
    } catch (error) {
        console.error('Jest tests failed:', error.stdout);
        throw new Error('Jest tests failed to run or failed assertions.');
    }

    console.log('PASS: Testing validation successful (files exist, dependencies install, and tests pass).');
    return {
      success: true,
      message: 'Testing validation successful (files exist, dependencies install, and tests pass).'
    };

  } catch (error) {
    console.error(`FAIL: Testing validation failed. ${error.message}`);
    return {
      success: false,
      message: `Testing validation failed: ${error.message}`
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