import fs from 'fs';
import path from 'path';

// Test the factorial function
async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');
  console.log(`[Validator] Starting validation in ${solutionDir}`);
  
  try {
    // Check if the file exists
    const filePath = path.join(solutionDir, 'factorial.js');
    if (!fs.existsSync(filePath)) {
      throw new Error('factorial.js file not found');
    }

    // Import the factorial function
    const modulePath = path.join(solutionDir, 'factorial.js');
    const { factorial } = await import(`file://${modulePath}`);

    // Check if factorial function exists
    if (typeof factorial !== 'function') {
      throw new Error('factorial function not found or not exported correctly');
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
        throw new Error(`factorial(${input}) returned ${result}, expected ${expected}`);
      }
    }

    // Test edge cases
    try {
      factorial(-1);
      console.warn('WARNING: factorial function should handle negative numbers');
    } catch (e) {
      // Expected behavior
      console.log('PASS: factorial correctly handles negative numbers');
    }

    try {
      factorial(3.14);
      console.warn('WARNING: factorial function should handle non-integers');
    } catch (e) {
      // Expected behavior
      console.log('PASS: factorial correctly handles non-integers');
    }

    console.log('PASS: All factorial tests passed');
    return {
      success: true,
      message: 'All factorial tests passed'
    };
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    return {
      success: false,
      message: error.message
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