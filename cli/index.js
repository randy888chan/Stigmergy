#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { SystemValidator } from "../src/bootstrap/system_validator.js";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { CoreBackup } from "../services/core_backup.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreBackup = new CoreBackup();

async function runGuardianCheck() {
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  if (await fs.pathExists(corePath)) return true;
  console.warn(chalk.yellow("⚠️ .stigmergy-core not found. Attempting to restore from latest backup..."));
  if (await coreBackup.restoreLatest()) {
    console.log(chalk.green("✅ Successfully restored .stigmergy-core from backup."));
    return true;
  }
  console.error(chalk.red("❌ Restore failed. Please run 'npx stigmergy install'."));
  return false;
}

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();
program.name("stigmergy").version(pkg.version);

program
  .command("start")
  .description("Starts the Stigmergy engine server in the current directory.")
  .option('--power', 'Run in Power Mode, requiring a connection to the Archon server.')
  .action(async (options) => {
    console.log(chalk.blue("Booting Stigmergy Engine..."));
    
    // CRITICAL FIX: Use an absolute path to the engine server based on this script's location
    const enginePath = path.resolve(__dirname, '../engine/server.js');
    
    try {
        const { Engine } = await import(enginePath);
        const engine = new Engine({ isPowerMode: options.power });
        if (await engine.initialize()) {
          await engine.start();
        } else {
          console.error(chalk.red("Engine initialization failed critical checks. Aborting startup."));
          process.exit(1);
        }
    } catch (e) {
        console.error(chalk.red("Failed to load the Stigmergy engine."), e);
        process.exit(1);
    }
  });

program
  .command("install")
  .description("Installs the Stigmergy core files into the current directory.")
  .action(async () => {
    const installPath = path.resolve(__dirname, './commands/install.js');
    const { install } = await import(installPath);
    await install();
  });

program
  .command("restore")
  .description("Restores the .stigmergy-core from the latest backup.")
  .action(async () => {
    const restorePath = path.resolve(__dirname, './commands/restore.js');
    const { default: restore } = await import(restorePath);
    await restore();
  });

program
  .command("validate")
  .description("Runs a system health check on the local installation.")
  .action(async () => {
    const validator = new SystemValidator();
    await validator.comprehensiveCheck();
  });

async function main() {
  try {
    const command = process.argv[2];
    // The guardian check should only run if a stigmergy command that REQUIRES a core is run.
    // 'install' does not require one to exist beforehand.
    if (command && command !== "install") {
      if (!await runGuardianCheck()) {
        process.exit(1);
      }
    }
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("❌ Unhandled CLI exception:", err);
    process.exit(1);
  }
}

main();