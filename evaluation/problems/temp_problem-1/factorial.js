/**
 * Calculate the factorial of a number
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n
 */
function factorial(n) {
  // Handle edge cases
  if (n < 0) {
    throw new Error("Factorial is not defined for negative numbers");
  }
  
  if (n === 0 || n === 1) {
    return 1;
  }
  
  // Calculate factorial
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  
  return result;
}

// Export the function
module.exports = { factorial };
