export default {
  testEnvironment: "node",
  setupFiles: ["./tests/setup.js"],
  testMatch: ["**/tests/**/*.test.js"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  // --- FIX: This is the critical change ---
  // This pattern tells Jest to NOT ignore the specified ESM modules in node_modules.
  transformIgnorePatterns: [
    "/node_modules/(?!(@mendable/firecrawl-js|@ai-sdk|ai|p-limit|@modelcontextprotocol/sdk)/)",
  ],
  // -----------------------------------------
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
};
