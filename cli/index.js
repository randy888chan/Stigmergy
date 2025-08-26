#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "module";
import { SystemValidator } from "../src/bootstrap/system_validator.js";
import open from "open";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { CoreBackup } from "../services/core_backup.js";

const coreBackup = new CoreBackup();

/**
 * Checks if .stigmergy-core exists. If not, it attempts to restore it from the latest backup.
 * This function acts as a gatekeeper for all CLI commands except 'install'.
 * @returns {Promise<boolean>} - True if the system can proceed, false otherwise.
 */
async function runGuardianCheck() {
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  if (await fs.pathExists(corePath)) {
    return true; // The core is present, proceed.
  }

  console.warn(
    chalk.yellow("⚠️ .stigmergy-core not found. Attempting to restore from latest backup...")
  );
  const success = await coreBackup.restoreLatest();

  if (success) {
    console.log(chalk.green("✅ Successfully restored .stigmergy-core from backup."));
    return true;
  } else {
    console.error(chalk.red("❌ Restore failed. No backups found."));
    console.log(
      chalk.cyan('--> Please run "npx stigmergy install" to perform a fresh installation.')
    );
    return false; // Halt execution.
  }
}

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("stigmergy")
  .description("Stigmergy 3.0: A Hybrid Autonomous System for development.")
  .version(pkg.version);

program
  .command("start")
  .description("Starts the Stigmergy engine server.")
  .action(async () => {
    console.log(chalk.blue("Booting Stigmergy Engine..."));
    const { Engine } = await import("../engine/server.js");
    const engine = new Engine();
    if (await engine.initialize()) {
      await engine.start();
    } else {
        console.error(chalk.red("Engine initialization failed. Aborting startup."));
        process.exit(1);
    }
  });

program
  .command("install")
  .description("Installs the .stigmergy-core.")
  .action(async () => {
    const { install } = await import("./commands/install.js");
    await install();
  });

// ... other commands (restore, validate, etc.)

program
  .command("restore")
  .description("Restore .stigmergy-core from last backup")
  .action(async () => {
    const { default: restore } = await import("./commands/restore.js");
    await restore();
  });

program
  .command("validate")
  .description("Run a comprehensive system health check.")
  .action(async () => {
    const validator = new SystemValidator();
    await validator.comprehensiveCheck();
  });

program
  .command("validate:agents")
  .description("Validate all agent definitions.")
  .action(async () => {
    const { validateAgents } = await import("./commands/validate.js");
    await validateAgents();
  });

// ... other commands (restore, validate, etc.)

async function main() {
  try {
    const command = process.argv[2];
    if (command && command !== "install") {
      if (!await runGuardianCheck()) process.exit(1);
    }
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("❌ Unhandled CLI exception:", err);
    process.exit(1);
  }
}

main();
