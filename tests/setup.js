import fs from "fs-extra";
import path from "path";

export default async () => {
  const workerId = process.env.JEST_WORKER_ID || '1';
  const TEST_CORE_PATH = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);
  const FIXTURE_CORE_PATH = path.join(process.cwd(), "tests", "fixtures", "test-core", ".stigmergy-core");

  // Clean up any previous test directory for this worker, with safety checks
  if (fs.existsSync(TEST_CORE_PATH)) {
    if (path.basename(TEST_CORE_PATH).startsWith('.stigmergy-core-test-temp-')) {
      fs.removeSync(TEST_CORE_PATH);
    } else {
      console.warn(`[Setup] Refused to remove non-test directory: ${TEST_CORE_PATH}`);
    }
  }

  // Create a fresh, isolated test core from our fixtures
  try {
    fs.copySync(FIXTURE_CORE_PATH, TEST_CORE_PATH);
  } catch (error) {
    console.error(`[Setup Worker ${workerId}] Failed to copy test fixtures:`, error);
    process.exit(1); // Exit if setup fails, to prevent running tests in a bad state
  }

  // Set an environment variable for the test files to use
  process.env.STIGMERGY_TEST_CORE_PATH = TEST_CORE_PATH;
};