
/**
 * Calculate the factorial of a number
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial of n
 */
export function factorial(n) {
  // Handle edge cases
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers');
  }
  
  if (!Number.isInteger(n)) {
    throw new Error('Factorial is only defined for integers');
  }
  
  // Base cases
  if (n === 0 || n === 1) {
    return 1;
  }
  
  // Calculate factorial iteratively
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  
  return result;
}
