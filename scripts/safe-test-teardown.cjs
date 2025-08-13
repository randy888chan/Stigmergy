// scripts/safe-test-teardown.js
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const REAL_CORE_DEST = path.join(process.cwd(), '.stigmergy-core');
const TEMP_PATH_FILE = path.join(os.tmpdir(), 'stigmergy-temp-path.txt');

async function teardown() {
  try {
    if (!fs.existsSync(TEMP_PATH_FILE)) return;
    const TEMP_LOCATION = fs.readFileSync(TEMP_PATH_FILE, 'utf8');
    if (fs.existsSync(TEMP_LOCATION)) {
      await fs.move(TEMP_LOCATION, REAL_CORE_DEST, { overwrite: true });
      fs.removeSync(TEMP_PATH_FILE);
      console.log('✅ Core restored from safe location.');
    }
  } catch (err) {
    console.error('❌ Failed during safe test teardown:', err);
  }
}
teardown();
