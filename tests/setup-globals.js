// This setup file runs in the test environment before each test file.
// It's responsible for setting up any global variables needed by the tests.

if (process.env.STIGMERGY_TEST_CORE_PATH) {
  global.StigmergyConfig = {
    core_path: process.env.STIGMERGY_TEST_CORE_PATH,
  };
} else {
  throw new Error(
    '[Setup Globals] CRITICAL: STIGMERGY_TEST_CORE_PATH is not set. ' +
    'This indicates a failure in the global test setup (tests/setup.js). ' +
    'Aborting to prevent tests from running in an unsafe, non-isolated environment.'
  );
}
