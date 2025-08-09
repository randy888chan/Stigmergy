export default {
  testEnvironment: "node",
  testTimeout: 30000,
  globalSetup: "./tests/globalSetup.js",
  setupFilesAfterEnv: ["./tests/setupAfterEnv.js"],
  modulePathIgnorePatterns: ["<rootDir>/.stigmergy-core"],
  transform: {
    "^.+\\.js$": "babel-jest",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|ansi-styles|ansi-regex|ansi|boxen|camelcase|chalk|cli|eastasianwidth|p-limit|string-width|string|strip-ansi|type-fest|widest-line|wrap-ansi)/)",
  ],
};
