const path = require("path");

// TESTS USE THIS SAFE COPY INSTEAD
const TEST_CORE = path.join(__dirname, "fixtures", "test-core");

global.StigmergyConfig = {
  core_path: TEST_CORE,
};
