import path from 'path';
import { TextEncoder, TextDecoder } from 'util';

// Polyfill for TextEncoder and TextDecoder which are not available in Bun's test environment
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

const TEST_TEMP_DIR = path.resolve(process.cwd(), '.stigmergy-core-test-temp');

// Set a global config for tests to use the temporary directory
global.StigmergyConfig = {
  core_path: TEST_TEMP_DIR,
  paths: {
    root: TEST_TEMP_DIR,
    agents: path.join(TEST_TEMP_DIR, 'agents'),
    system_docs: path.join(TEST_TEMP_DIR, 'system_docs'),
  }
};
