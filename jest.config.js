export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ["dotenv/config", "<rootDir>/tests/setup-globals.js"],
  globalSetup: "<rootDir>/tests/setup.js",
  globalTeardown: "<rootDir>/tests/teardown.js",
  testTimeout: 30000,
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    "\\.css$": "identity-obj-proxy",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(" +
    "ora|chalk|strip-ansi|ansi-styles|ansi-regex|is-fullwidth-code-point|" +
    "string-width|wrap-ansi|file-type|strtok3|peek-readable|token-types|" +
        "get-stream|@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|fs-extra|uuid|rxjs|langsmith|ws" +
    "))",
  ],
};