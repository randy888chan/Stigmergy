import fs from 'fs-extra';
import path from 'path';

module.exports = async () => {
  // Set up environment variables for tests
  process.env.NEO4J_URI = "bolt://localhost:7687";
  process.env.NEO4J_USER = "test";
  process.env.NEO4J_PASSWORD = "test";

  // Check if .stigmergy-core exists before trying to copy it
  const corePath = path.join(process.cwd(), '.stigmergy-core');
  if (!fs.existsSync(corePath)) {
    // If the core directory doesn't exist, we can't create the test copy.
    // This is not necessarily an error during tests, as some tests might not need it.
    // We can set the path to null and let individual tests handle it.
    console.log('Skipping test core setup: .stigmergy-core not found.');
    process.env.TEST_CORE_PATH = null;
    return;
  }

  const testCorePath = path.join(__dirname, 'fixtures', '.stigmergy-core-test');

  // Copy core instead of deleting
  if (!fs.existsSync(testCorePath)) {
    await fs.copy(
      corePath,
      testCorePath
    );
  }

  process.env.TEST_CORE_PATH = testCorePath;
};
