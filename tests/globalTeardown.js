const fs = require('fs-extra');
const path = require('path');

module.exports = async () => {
  console.log("\n teardown");
  console.log("================================");

  const REAL_CORE = path.join(process.cwd(), '.stigmergy-core');
  const TEST_CORE = path.join(__dirname, 'fixtures', '.stigmergy-core-test');

  // Clean up ONLY the test copy
  if (fs.existsSync(TEST_CORE)) {
    await fs.remove(TEST_CORE);
    console.log("✅ Cleaned up test core at:", TEST_CORE);
  }

  // Clean up the env file
  const ENV_FILE = path.join(__dirname, 'test-env.json');
  if (fs.existsSync(ENV_FILE)) {
    await fs.remove(ENV_FILE);
    console.log("✅ Cleaned up test environment file.");
  }

  // Verify your real core is STILL THERE
  if (!fs.existsSync(REAL_CORE)) {
    console.error("\n🔥 CRITICAL: YOUR CORE WAS DELETED! THIS SHOULD NEVER HAPPEN!");
    process.exit(1);
  } else {
    console.log("🛡️  Verified your real .stigmergy-core is still safe.\n");
  }
};
