const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);
const solutionDir = path.join(__dirname, 'temp_solution');

async function main() {
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
        const { stdout, stderr } = await execPromise(jestPath, { cwd: solutionDir });
        console.log('Jest stdout:', stdout);
        if (stderr) {
            console.error('Jest stderr:', stderr);
        }
    } catch (error) {
        console.error('Jest tests failed:', error.stdout);
        throw new Error('Jest tests failed to run or failed assertions.');
    }

    console.log('PASS: Testing validation successful (files exist, dependencies install, and tests pass).');
    process.exit(0);

  } catch (error) {
    console.error(`FAIL: Testing validation failed. ${error.message}`);
    process.exit(1);
  }
}

main();