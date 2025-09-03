import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import coreBackup from "../../services/core_backup.js";
import { configureIde } from "./install_helpers.js";
import config from "../../stigmergy.config.js";

async function findProjectRoot(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

export async function install() {
  const targetDir = process.cwd();
  console.log(`Installing Stigmergy core into: ${targetDir}`);

  // Allow test suites to override the source core path
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sourceCoreDir = global.StigmergyConfig?.core_path || path.resolve(await findProjectRoot(__dirname), ".stigmergy-core");

  if (!sourceCoreDir || !(await fs.pathExists(sourceCoreDir))) {
      console.error(`Source .stigmergy-core not found at ${sourceCoreDir}. Cannot proceed.`);
      return false;
  }
  
  const targetCoreDir = path.join(targetDir, ".stigmergy-core");

  if (sourceCoreDir === targetCoreDir) {
    console.log("Running install in the project root. Skipping core file copy.");
  } else {
    if (await fs.pathExists(targetCoreDir)) {
        console.log("⚠️ .stigmergy-core already exists. Overwriting for a clean installation.");
        await fs.remove(targetCoreDir);
    }
    await fs.copy(sourceCoreDir, targetCoreDir);
    console.log("✅ .stigmergy-core installed successfully.");
  }

  await configureIde(targetDir);
  
  const projectRoot = await findProjectRoot(__dirname);
  if (projectRoot) {
      const sourceEnv = path.resolve(projectRoot, ".env.example");
      const targetEnv = path.join(targetDir, ".env.stigmergy.example");
      const fallbackTargetEnv = path.join(targetDir, ".env.example");
      
      // Check if target already has .env.example, if so use .env.stigmergy.example
      if (await fs.pathExists(fallbackTargetEnv)) {
        await fs.copy(sourceEnv, targetEnv, { overwrite: false });
        console.log("✅ .env.stigmergy.example created (preserving existing .env.example).");
        console.log("💡 Copy .env.stigmergy.example to .env and configure your API keys.");
      } else {
        await fs.copy(sourceEnv, fallbackTargetEnv, { overwrite: false });
        console.log("✅ .env.example created.");
      }
  }

  await coreBackup.autoBackup();
  console.log("✅ Initial backup of new core created.");
  
  console.log("\n🚀 Stigmergy installation complete.");
  console.log("Next steps:");
  console.log("1. Copy the appropriate .env example file to .env and add your API keys.");
  console.log("2. Run `stigmergy start` to launch the engine.");
  return true;
}
