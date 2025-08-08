export default {
  testEnvironment: "node",
  testMatch: ["**/tests/**/*.test.js"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  // --- FIX: This is the critical change ---
  // This pattern tells Jest to NOT ignore the specified ESM modules in node_modules.
  transformIgnorePatterns: [
    "/node_modules/(?!(@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|ansi-styles|ansi-regex|ansi|boxen|camelcase|chalk|cli|eastasianwidth|p-limit|string-width|string|strip-ansi|type-fest|widest-line|wrap-ansi)/)",
  ],
  // -----------------------------------------
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  setupFilesAfterEnv: ["./tests/setupAfterEnv.js"],
  globalSetup: "./tests/globalSetup.js",
};
