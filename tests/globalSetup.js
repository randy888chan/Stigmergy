import fs from "fs-extra";
import path from "path";
import coreBackup from "../services/core_backup.js";

module.exports = async () => {
  // Create test-specific core copy
  const testCorePath = path.join(__dirname, "fixtures", "test-core");
  await coreBackup.createBackup(); // Permanent backup first
  await fs.copy(path.join(process.cwd(), ".stigmergy-core"), testCorePath);

  process.env.TEST_CORE_PATH = testCorePath;
};
