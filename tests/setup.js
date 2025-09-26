import fs from 'fs-extra';
import path from 'path';

const TEST_TEMP_DIR = path.resolve(process.cwd(), '.stigmergy-core-test-temp');
const CORE_DIR = path.resolve(process.cwd(), '.stigmergy-core');

if (fs.existsSync(TEST_TEMP_DIR)) {
  fs.removeSync(TEST_TEMP_DIR);
}
fs.ensureDirSync(TEST_TEMP_DIR);

// Copy the .stigmergy-core contents to the temporary directory
if (fs.existsSync(CORE_DIR)) {
  fs.copySync(CORE_DIR, TEST_TEMP_DIR);
}

console.log(`[Global Setup] Created test directory: ${TEST_TEMP_DIR}`);
console.log(`[Global Setup] Copied .stigmergy-core contents to test directory`);