const fs = require('fs');
const path = require('path');

// Test the factorial function
try {
  // Check if the file exists
  if (!fs.existsSync(path.join(__dirname, '../temp_solution/factorial.js'))) {
    console.error('FAIL: factorial.js file not found');
    process.exit(1);
  }

  // Import the factorial function
  const { factorial } = require('../temp_solution/factorial.js');

  // Check if factorial function exists
  if (typeof factorial !== 'function') {
    console.error('FAIL: factorial function not found or not exported correctly');
    process.exit(1);
  }

  // Test cases
  const testCases = [
    { input: 0, expected: 1 },
    { input: 1, expected: 1 },
    { input: 5, expected: 120 },
    { input: 10, expected: 3628800 }
  ];

  // Run tests
  for (const { input, expected } of testCases) {
    const result = factorial(input);
    if (result !== expected) {
      console.error(`FAIL: factorial(${input}) returned ${result}, expected ${expected}`);
      process.exit(1);
    }
  }

  // Test edge cases
  try {
    factorial(-1);
    console.warn('WARNING: factorial function should handle negative numbers');
  } catch (e) {
    // Expected behavior
  }

  try {
    factorial(3.14);
    console.warn('WARNING: factorial function should handle non-integers');
  } catch (e) {
    // Expected behavior
  }

  console.log('PASS: All factorial tests passed');
  process.exit(0);
} catch (error) {
  console.error(`FAIL: ${error.message}`);
  process.exit(1);
}