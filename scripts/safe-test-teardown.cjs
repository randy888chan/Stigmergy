const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const REAL_CORE_DEST = path.join(process.cwd(), '.stigmergy-core');
const TEMP_PATH_FILE = path.join(os.tmpdir(), 'stigmergy-temp-path.txt');
const TEMP_TEST_CORE = path.join(process.cwd(), '.stigmergy-core-test-temp');

async function teardown() {
  try {
    await fs.remove(TEMP_TEST_CORE);
    if (fs.existsSync(TEMP_PATH_FILE)) {
      const TEMP_LOCATION = fs.readFileSync(TEMP_PATH_FILE, 'utf8');
      if (fs.existsSync(TEMP_LOCATION)) {
        await fs.move(TEMP_LOCATION, REAL_CORE_DEST, { overwrite: true });
        fs.removeSync(TEMP_PATH_FILE);
      }
    }
  } catch (err) { console.error('Teardown failed:', err); }
}
teardown();
