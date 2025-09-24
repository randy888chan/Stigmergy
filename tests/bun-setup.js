import fs from "fs-extra";
import path from "path";
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'stream/web';
import { GlobalRegistrator } from '@happy-dom/global-registrator';

// This line creates the fake window, document, etc.
GlobalRegistrator.register();

// Create a temporary directory for the tests
const workerId = '1'; // Bun doesn't have worker IDs like Jest, so we'll just use '1'
const TEST_CORE_PATH = path.join(process.cwd(), `.stigmergy-core-test-temp-${workerId}`);
const FIXTURE_CORE_PATH = path.join(process.cwd(), "tests", "fixtures", "test-core", ".stigmergy-core");

// Clean up any previous test directory
if (fs.existsSync(TEST_CORE_PATH)) {
  if (path.basename(TEST_CORE_PATH).startsWith('.stigmergy-core-test-temp-')) {
    fs.removeSync(TEST_CORE_PATH);
  } else {
    console.warn(`[Setup] Refused to remove non-test directory: ${TEST_CORE_PATH}`);
  }
}

// Create a fresh, isolated test core from our fixtures
try {
  fs.copySync(FIXTURE_CORE_PATH, TEST_CORE_PATH);
} catch (error) {
  console.error(`[Setup] Failed to copy test fixtures:`, error);
  process.exit(1); // Exit if setup fails
}

// Set environment variables for the tests to use
process.env.STIGMERGY_CORE_PATH = TEST_CORE_PATH;
process.env.STIGMERGY_TEST_CORE_PATH = TEST_CORE_PATH;

// Set up globals
global.StigmergyConfig = {
  core_path: process.env.STIGMERGY_TEST_CORE_PATH,
};

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;

if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}

// Register a cleanup function to be called on process exit
process.on('exit', () => {
  if (fs.existsSync(TEST_CORE_PATH)) {
    if (path.basename(TEST_CORE_PATH).includes('.stigmergy-core-test-temp')) {
      try {
        fs.removeSync(TEST_CORE_PATH);
        console.log(`[Teardown] Cleaned up temporary directory: ${TEST_CORE_PATH}`);
      } catch (error) {
        console.error(`[Teardown] Failed to clean up temp directory ${TEST_CORE_PATH}:`, error.message);
      }
    } else {
      console.warn(`[Teardown] Refusing to delete non-test directory: ${TEST_CORE_PATH}`);
    }
  }
});
