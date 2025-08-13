const path = require("path");
const TEST_CORE = path.join(process.cwd(), ".stigmergy-core-test-temp");
global.StigmergyConfig = { core_path: TEST_CORE };
