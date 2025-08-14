export default {
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testEnvironment: "node",
  testTimeout: 30000,
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|ansi-styles|ansi-regex|ansi|boxen|camelcase|chalk|cli|eastasianwidth|p-limit|string-width|string|strip-ansi|type-fest|widest-line|wrap-ansi)/)",
  ],
  globalTeardown: "<rootDir>/jest.teardown.cjs",
};
