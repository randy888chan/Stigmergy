const fs = require('fs-extra');
const path = require('path');

module.exports = async () => {
  // THIS RUNS ONCE BEFORE ALL TESTS
  console.log("\n🚀 GLOBAL TEST SETUP INITIALIZED");
  console.log("================================");

  // Define paths
  const REAL_CORE = path.join(process.cwd(), '.stigmergy-core');
  const TEST_CORE = path.join(__dirname, 'fixtures', '.stigmergy-core-test');
  const ENV_FILE = path.join(__dirname, 'test-env.json');

  // 1. Verify real core exists
  if (!fs.existsSync(REAL_CORE)) {
    console.error("\n❌ CRITICAL: Your .stigmergy-core is missing!");
    process.exit(1);
  }
  console.log("✅ Verified real core exists at:", REAL_CORE);

  // 2. Create SAFE COPY for tests
  await fs.remove(TEST_CORE);
  await fs.copy(REAL_CORE, TEST_CORE);

  // 3. Write the test core path to a file for workers to read
  const testEnv = { TEST_CORE_PATH: TEST_CORE };
  fs.writeFileSync(ENV_FILE, JSON.stringify(testEnv));

  console.log("🛡️  YOUR .stigmergy-core IS 100% SAFE");
  console.log("   Tests will use a SAFE COPY for testing: " + TEST_CORE + "\n");

  // Also set globals for any code that might rely on it (though file is safer)
  global.TEST_CORE_PATH = TEST_CORE;
  global.StigmergyConfig = { core_path: TEST_CORE, real_core: REAL_CORE };
};
