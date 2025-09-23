// This setup file runs in the test environment before each test file.
// It's responsible for setting up any global variables needed by the tests.

if (process.env.STIGMERGY_TEST_CORE_PATH) {
  global.StigmergyConfig = {
    core_path: process.env.STIGMERGY_TEST_CORE_PATH,
  };
} else {
  throw new Error(
    '[Setup Globals] CRITICAL: STIGMERGY_TEST_CORE_PATH is not set. ' +
    'This indicates a failure in the global test setup (tests/setup.js). ' +
    'Aborting to prevent tests from running in an unsafe, non-isolated environment.'
  );
}

// Polyfill for TextEncoder/TextDecoder and Streams, which are available in Node.js
// but not in the default JSDOM environment. This is necessary for libraries like
// @noble/hashes, @ai-sdk, and others that expect a browser-like or modern Node.js environment.
import { TextEncoder, TextDecoder } from 'util';
import { ReadableStream, TransformStream } from 'stream/web';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
global.ReadableStream = ReadableStream;
global.TransformStream = TransformStream;

// Polyfill for setImmediate, used by libraries like multer, which is not available in JSDOM.
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (callback, ...args) => setTimeout(callback, 0, ...args);
}
