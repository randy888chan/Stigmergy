export default {
  testEnvironment: "node",
  // No transform is needed for modern Node with ESM
  testMatch: ["**/tests/**/*.test.js"],
  // This helps Jest understand it's an ESM project
  extensionsToTreatAsEsm: [".js"],
  moduleNameMapper: {
    // This mapping helps with ESM imports if you have issues with extensions
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
