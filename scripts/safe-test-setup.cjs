const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const REAL_CORE = path.join(process.cwd(), '.stigmergy-core');
const TEMP_LOCATION = path.join(os.tmpdir(), `stigmergy-core-backup-${Date.now()}`);
const TEMP_PATH_FILE = path.join(os.tmpdir(), 'stigmergy-temp-path.txt');
const TEST_CORE_FIXTURE = path.join(process.cwd(), 'tests', 'fixtures', 'test-core');
const TEMP_TEST_CORE = path.join(process.cwd(), '.stigmergy-core-test-temp');

async function setup() {
  try {
    if (fs.existsSync(REAL_CORE)) {
      await fs.move(REAL_CORE, TEMP_LOCATION);
      fs.writeFileSync(TEMP_PATH_FILE, TEMP_LOCATION);
    }
    await fs.copy(TEST_CORE_FIXTURE, TEMP_TEST_CORE);
  } catch (err) { console.error('Setup failed:', err); process.exit(1); }
}
setup();
