// jest.config.js
export default {
  // Use jsdom for tests that involve the dashboard's React components
  testEnvironment: 'jest-environment-jsdom',

  setupFiles: ["dotenv/config", "<rootDir>/tests/setup-globals.js"],
  globalSetup: "<rootDir>/tests/setup.js",
  globalTeardown: "<rootDir>/tests/teardown.js",
  testTimeout: 30000,

  // This is the key for handling ES Modules. It tells Jest to use Babel
  // to transform your JS/JSX files before running tests.
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },

  // This section is crucial for handling non-JS files.
  moduleNameMapper: {
    // When Jest sees an import for a CSS file, it will replace it
    // with the identity-obj-proxy mock. This prevents syntax errors.
    "\\.css$": "identity-obj-proxy",
  },

  // This pattern is important. By default, Jest doesn't transform node_modules.
  // However, some modern packages are published as ES Modules, which will break tests.
  // This regex tells Jest to NOT ignore these specific packages so they can be transformed by Babel.
  transformIgnorePatterns: [
    "/node_modules/(?!(@ai-sdk|ai|@mendable/firecrawl-js|@modelcontextprotocol|ansi-styles|ansi-regex|ansi|boxen|camelcase|chalk|cli|eastasianwidth|p-limit|string-width|string|strip-ansi|type-fest|widest-line|wrap-ansi|file-type|strtok3|peek-readable|token-types)/)",
  ],
};