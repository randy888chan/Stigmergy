import fs from 'fs';
import path from 'path';

// Test the factorial function
async function validate(directory) {
  // Use the provided directory parameter, fallback to a default if not provided
  const solutionDir = directory ? path.resolve(directory) : path.join(process.cwd(), 'temp_solution');
  
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
    } catch (e) {
      // Expected behavior
    }

    try {
      factorial(3.14);
    } catch (e) {
      // Expected behavior
    }

    return {
      success: true,
      message: 'All factorial tests passed'
    };
  } catch (error) {
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