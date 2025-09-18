import fs from "fs-extra";
import path from "path";

// Create a unique test directory for each Jest worker to prevent conflicts
const workerId = process.env.JEST_WORKER_ID || '1';
const TEST_CORE = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);
const FIXTURE_CORE = path.join(process.cwd(), "tests", "fixtures", "test-core", ".stigmergy-core");

// Store the original configuration before overriding
const ORIGINAL_CORE_PATH = path.join(process.cwd(), ".stigmergy-core");

// Enhanced safety check - ensure we're not accidentally targeting the source directory
const sourceCorePath = path.join(process.cwd(), ".stigmergy-core");
if (TEST_CORE === sourceCorePath) {
  throw new Error(`Test directory path conflict: ${TEST_CORE} would overwrite source .stigmergy-core directory`);
}

// Additional safety check - ensure the test directory name contains our identifier
if (!TEST_CORE.includes('.stigmergy-core-test-temp')) {
  throw new Error(`Invalid test directory name: ${TEST_CORE} does not contain safety identifier`);
}

// Clean up any previous test runs for this specific worker
if (fs.existsSync(TEST_CORE)) {
  // Extra safety check - only remove if it's clearly a test directory
  if (TEST_CORE.includes('.stigmergy-core-test-temp')) {
    fs.removeSync(TEST_CORE);
  } else {
    throw new Error(`Refusing to remove non-test directory: ${TEST_CORE}`);
  }
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
  
  // Clean up test directory with multiple safety checks
  if (fs.existsSync(TEST_CORE)) {
    try {
      // Ensure we're only deleting test directories
      if (TEST_CORE.includes('.stigmergy-core-test-temp') && 
          path.basename(TEST_CORE).startsWith('.stigmergy-core-test-temp')) {
        fs.removeSync(TEST_CORE);
      } else {
        console.warn(`Skipping deletion of non-test directory: ${TEST_CORE}`);
      }
    } catch (error) {
      console.warn(`Failed to clean up test directory ${TEST_CORE}:`, error.message);
    }
  }
};