const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

// Test the testing implementation
try {
  // Check if required files exist
  const requiredFiles = ['__tests__/calculator.test.js', 'calculator.js'];
  for (const file of requiredFiles) {
    if (!fs.existsSync(path.join(__dirname, '../temp_solution', file))) {
      console.error(`FAIL: ${file} file not found`);
      process.exit(1);
    }
  }

  // Check calculator.js for basic function exports
  const calculatorContent = fs.readFileSync(path.join(__dirname, '../temp_solution/calculator.js'), 'utf8');
  
  // Check for basic math functions
  const mathFunctions = ['add', 'subtract', 'multiply', 'divide'];
  const hasMathFunctions = mathFunctions.some(func => calculatorContent.includes(func));
  
  if (!hasMathFunctions) {
    console.warn('WARNING: calculator.js might not export standard math functions');
  }

  // Check test file for basic test structure
  const testContent = fs.readFileSync(path.join(__dirname, '../temp_solution/__tests__/calculator.test.js'), 'utf8');
  
  // Check for Jest patterns
  if (!testContent.includes('describe') || !testContent.includes('it') || !testContent.includes('expect')) {
    console.warn('WARNING: Test file might not follow Jest testing patterns');
  }

  // Try to run the tests
  const jest = spawn('npx', ['jest', '__tests__/calculator.test.js'], {
    cwd: path.join(__dirname, '../temp_solution'),
    stdio: 'pipe'
  });

  let testOutput = '';
  jest.stdout.on('data', (data) => {
    testOutput += data.toString();
  });

  jest.stderr.on('data', (data) => {
    testOutput += data.toString();
  });

  jest.on('close', (code) => {
    if (code !== 0) {
      console.error(`FAIL: Tests failed with exit code ${code}`);
      console.error(`Test output: ${testOutput}`);
      process.exit(1);
    }
    
    // Check for test coverage if mentioned
    if (testOutput.includes('Coverage')) {
      console.log('PASS: Tests ran successfully');
      process.exit(0);
    } else {
      console.log('PASS: Test files exist and follow basic structure');
      process.exit(0);
    }
  });

  // Timeout after 10 seconds
  setTimeout(() => {
    console.error('FAIL: Tests did not complete in time');
    jest.kill();
    process.exit(1);
  }, 10000);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}