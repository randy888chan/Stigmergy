// Setup script that runs before each test file
// Sets a global configuration variable that points to the temporary .stigmergy-core directory

import { mock } from "bun:test";

// DEFINITIVE FIX: The ECONNREFUSED error is caused by the OpenTelemetry SDK
// attempting to make network connections during test teardown. By globally
// mocking the tracing service here, we ensure that for ALL tests, the real
// SDK is never initialized, preventing any network-related errors.
mock.module("../services/tracing.js", () => ({
  sdk: {
    start: mock(),
    shutdown: mock(async () => {}),
  },
  trace: {
    getTracer: () => ({
      startActiveSpan: (name, fn) =>
        fn({
          setAttribute: () => {},
          recordException: () => {},
          setStatus: () => {},
          end: () => {},
        }),
    }),
  },
  SpanStatusCode: {
    ERROR: "ERROR",
  },
}));

// Set the global test configuration
global.testConfig = {
  stigmergyCoreDir: ".stigmergy-core-test",
  isTestEnvironment: true,
};

// You can also set environment variables for tests
process.env.NODE_ENV = "test";
process.env.STIGMERGY_CORE_DIR = ".stigmergy-core-test";
