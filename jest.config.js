export default {
  setupFiles: ["dotenv/config", "<rootDir>/tests/setup-globals.js"],
  globalSetup: "<rootDir>/tests/setup.js",
  globalTeardown: "<rootDir>/tests/teardown.js",
  testEnvironment: "node",
  testTimeout: 30000,
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|ansi-styles|ansi-regex|ansi|boxen|camelcase|chalk|cli|eastasianwidth|p-limit|string-width|string|strip-ansi|type-fest|widest-line|wrap-ansi|file-type|strtok3|peek-readable|token-types)/)",
  ],
};