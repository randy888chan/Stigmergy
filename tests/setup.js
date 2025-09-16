import fs from "fs-extra";
import path from "path";

// Create a unique test directory for each Jest worker to prevent conflicts
const workerId = process.env.JEST_WORKER_ID || '1';
const TEST_CORE = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);
const FIXTURE_CORE = path.join(process.cwd(), "tests", "fixtures", "test-core");

// Store the original configuration before overriding
const ORIGINAL_CORE_PATH = path.join(process.cwd(), ".stigmergy-core");

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

// Store original config and set test config
global.StigmergyConfig_Original = global.StigmergyConfig || { core_path: ORIGINAL_CORE_PATH };
global.StigmergyConfig = { core_path: TEST_CORE };

// Cleanup function for after tests
global.restoreStigmergyConfig = () => {
  if (global.StigmergyConfig_Original) {
    global.StigmergyConfig = global.StigmergyConfig_Original;
  } else {
    delete global.StigmergyConfig;
  }
  
  // Clean up test directory
  if (fs.existsSync(TEST_CORE)) {
    try {
      fs.removeSync(TEST_CORE);
    } catch (error) {
      console.warn(`Failed to clean up test directory ${TEST_CORE}:`, error.message);
    }
  }
};