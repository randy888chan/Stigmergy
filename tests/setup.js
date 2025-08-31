const fs = require("fs-extra");
const path = require("path");

// Create a unique test directory for each Jest worker to prevent conflicts
const workerId = process.env.JEST_WORKER_ID || '1';
const TEST_CORE = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);
const FIXTURE_CORE = path.join(process.cwd(), "tests", "fixtures", "test-core");

// Clean up any previous test runs for this specific worker
if (fs.existsSync(TEST_CORE)) {
  fs.removeSync(TEST_CORE);
}

// Create a fresh, isolated test core from our fixtures
try {
  fs.copySync(FIXTURE_CORE, TEST_CORE);
} catch (error) {
  console.error(`[Worker ${workerId}] Failed to copy test fixtures:`, error);
  process.exit(1);
}

// Set the global config that the application will use to find the core files.
// Each worker now points to its own isolated core directory.
global.StigmergyConfig = { core_path: TEST_CORE };
