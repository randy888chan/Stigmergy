import fs from "fs-extra";
import path from "path";

module.exports = async () => {
  const originalCorePath = path.join(__dirname, "fixtures", "test-core");
  const testCorePath = path.join(process.cwd(), ".stigmergy-core");

  // Ensure a clean slate for tests
  await fs.remove(testCorePath);
  await fs.copy(originalCorePath, testCorePath);

  process.env.TEST_CORE_PATH = testCorePath;
};
