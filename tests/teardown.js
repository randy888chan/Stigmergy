// This file is executed after all tests have completed.
// It's a good place to clean up any global resources.
// console.log("All tests have completed. Tearing down global resources.");

// The line below was a workaround for a resource leak that caused tests to hang.
// The architectural fix in `tool_executor.js` should make this unnecessary.
// A healthy test suite should exit gracefully on its own.
