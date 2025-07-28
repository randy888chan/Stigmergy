export default {
  testEnvironment: "node",
  transform: {
    "^.+\.js$": "babel-jest",
  },
  testMatch: ["**/tests/**/*.test.js"],
  globals: {
    "ts-jest": {
      useESM: true,
    },
  },
};
