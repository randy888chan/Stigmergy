const fs = require("fs-extra");
const path = require("path");

// YOUR REAL CORE (NEVER TOUCHED BY TESTS)
const REAL_CORE = path.join(process.cwd(), ".stigmergy-core");

// TESTS USE THIS SAFE COPY INSTEAD
const TEST_CORE = path.join(__dirname, "fixtures", ".stigmergy-core-test");

beforeAll(async () => {
  // Create SAFE COPY for tests (NEVER touches your real core)
  await fs.remove(TEST_CORE);
  await fs.copy(REAL_CORE, TEST_CORE);

  // Force all tests to use SAFE COPY
  process.env.TEST_CORE_PATH = TEST_CORE;
  global.StigmergyConfig = {
    core_path: TEST_CORE,
    real_core: REAL_CORE,
  };

  console.log("\n🛡️  YOUR .stigmergy-core IS 100% SAFE");
  console.log("   Real core: " + REAL_CORE);
  console.log("   Tests use: " + TEST_CORE + "\n");
});

afterAll(async () => {
  // Clean up ONLY the test copy (your real core stays safe)
  if (fs.existsSync(TEST_CORE)) {
    await fs.remove(TEST_CORE);
  }

  // Verify your real core is STILL THERE
  if (!fs.existsSync(REAL_CORE)) {
    console.error("\n🔥 CRITICAL: YOUR CORE WAS DELETED! THIS SHOULD NEVER HAPPEN!");
    process.exit(1);
  }
});
