// scripts/safe-test-setup.js
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const REAL_CORE = path.join(process.cwd(), '.stigmergy-core');
const TEMP_LOCATION = path.join(os.tmpdir(), `stigmergy-core-backup-${Date.now()}`);
const TEMP_PATH_FILE = path.join(os.tmpdir(), 'stigmergy-temp-path.txt');

async function setup() {
  try {
    if (!fs.existsSync(REAL_CORE)) {
      console.error('❌ CRITICAL: .stigmergy-core not found. Cannot run tests.');
      process.exit(1);
    }
    await fs.move(REAL_CORE, TEMP_LOCATION);
    fs.writeFileSync(TEMP_PATH_FILE, TEMP_LOCATION);
    console.log(`✅ Core moved to safe location: ${TEMP_LOCATION}`);
  } catch (err) {
    console.error('❌ Failed during safe test setup:', err);
    process.exit(1);
  }
}
setup();
