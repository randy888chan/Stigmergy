import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import coreBackup from "../../services/core_backup.js";
import { configureIde } from "./install_helpers.js"; // We will create this helper file.

export async function install() {
  const targetDir = process.cwd();
  console.log(`Installing Stigmergy core into: ${targetDir}`);
  
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Navigate up from cli/commands to the package root to find .stigmergy-core
  const sourceCoreDir = path.resolve(__dirname, "../../.stigmergy-core");
  const targetCoreDir = path.join(targetDir, ".stigmergy-core");

  if (await fs.pathExists(targetCoreDir)) {
      console.log("⚠️ .stigmergy-core already exists. Overwriting for a clean installation.");
      await fs.remove(targetCoreDir);
  }

  await fs.copy(sourceCoreDir, targetCoreDir);
  console.log("✅ .stigmergy-core installed successfully.");

  // Create .roomodes and .env.example
  await configureIde(targetCoreDir);
  
  const sourceEnv = path.resolve(__dirname, "../../.env.example");
  const targetEnv = path.join(targetDir, ".env.example");
  await fs.copy(sourceEnv, targetEnv, { overwrite: false });
  console.log("✅ .env.example created.");

  await coreBackup.autoBackup();
  console.log("✅ Initial backup of new core created.");
  
  console.log("\n🚀 Stigmergy installation complete.");
  console.log("Next steps:");
  console.log("1. Rename `.env.example` to `.env` and add your API keys.");
  console.log("2. Run `stigmergy start` to launch the engine.");
}