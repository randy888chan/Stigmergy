// This setup file runs in the test environment before each test file.
// It's responsible for setting up any global variables needed by the tests.

if (process.env.STIGMERGY_TEST_CORE_PATH) {
  global.StigmergyConfig = {
    core_path: process.env.STIGMERGY_TEST_CORE_PATH,
  };
} else {
  // This provides a fallback for tests that might be run individually
  // without the global setup script. It's not ideal for the main suite,
  // but prevents crashes in isolated test runs.
  console.warn('[Setup Globals] STIGMERGY_TEST_CORE_PATH not set. Some tests may fail.');
  global.StigmergyConfig = {
    core_path: './.stigmergy-core-fallback', // A default fallback path
  };
}
