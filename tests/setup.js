import fs from 'fs-extra';
import path from 'path';

const TEST_TEMP_DIR = path.resolve(process.cwd(), '.stigmergy-core-test-temp');

if (fs.existsSync(TEST_TEMP_DIR)) {
  fs.removeSync(TEST_TEMP_DIR);
}
fs.ensureDirSync(TEST_TEMP_DIR);

console.log(`[Global Setup] Created test directory: ${TEST_TEMP_DIR}`);
