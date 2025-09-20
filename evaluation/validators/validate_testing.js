import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');

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
    try {
        const packageJsonPath = path.join(solutionDir, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            await execPromise('npm init -y', { cwd: solutionDir });
        }
        await execPromise('npm install jest', { cwd: solutionDir });
    } catch (error) {
        throw new Error('npm install failed.');
    }

    // 3. Run the tests with Jest
    try {
        const jestPath = path.join(solutionDir, 'node_modules/.bin/jest');
        await execPromise(`${jestPath} --coverage`, { cwd: solutionDir });
    } catch (error) {
        throw new Error('Jest tests failed to run or failed assertions.');
    }

    return {
      success: true,
      message: 'Testing validation successful (files exist, dependencies install, and tests pass).'
    };

  } catch (error) {
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