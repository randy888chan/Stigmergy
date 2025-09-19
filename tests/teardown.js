import fs from "fs-extra";
import path from "path";

export default async () => {
  const workerId = process.env.JEST_WORKER_ID || '1';
  const TEST_CORE_PATH = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);

  // Safety check and cleanup
  if (fs.existsSync(TEST_CORE_PATH)) {
    // Add a safety check to ensure the path being deleted contains the temp marker
    if (path.basename(TEST_CORE_PATH).includes('.stigmergy-core-test-temp')) {
      try {
        fs.removeSync(TEST_CORE_PATH);
        console.log(`[Teardown Worker ${workerId}] Cleaned up temporary directory: ${TEST_CORE_PATH}`);
      } catch (error) {
        console.error(`[Teardown Worker ${workerId}] Failed to clean up temp directory ${TEST_CORE_PATH}:`, error.message);
      }
    } else {
      console.warn(`[Teardown Worker ${workerId}] Refusing to delete non-test directory: ${TEST_CORE_PATH}`);
    }
  }
};