#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "module";
// --- START: ADDITIONS ---
import { CoreBackup } from "../services/core_backup.js";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import { SystemValidator } from "../src/bootstrap/system_validator.js";
import open from "open";
import inquirer from "inquirer";

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
// --- END: ADDITIONS ---

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("stigmergy")
  .description("Stigmergy 3.0: A Hybrid Autonomous System for development.")
  .version(pkg.version);

program
  .command("start")
  .description("Starts the Stigmergy engine server (MCP).")
  .action(async () => {
    // TODO: Implement engine start logic using the new Engine class.
    console.log("Starting engine... (implementation pending)");
    // Example:
    // const { Engine } = await import("../engine/server.js");
    // const engine = new Engine();
    // engine.initialize();
    // engine.start(); // Assuming a start method exists
  });

program
  .command("dashboard")
  .description("Open the Stigmergy dashboard.")
  .action(() => {
    // This needs to be updated to point to the correct dashboard implementation
    console.log("Opening dashboard (placeholder)...");
    // import('../dashboard/server.js');
    // open('http://localhost:8080');
  });

// The config wizard can be kept as a utility
program
  .command("config-wizard")
  .description("Run an interactive wizard to configure Stigmergy for your project.")
  .action(async () => {
    // This wizard can be updated later to reflect the new .env format
    console.log("Welcome to the Stigmergy Configuration Wizard!");
    // (Existing wizard code can be kept and adapted later)
  });

program
  .command("build")
  .description("Builds agent definitions into a bundle.")
  .option("--all", "Build all agents", true)
  .action(async () => {
    const { default: build } = await import("./commands/build.js");
    await build();
  });

program
  .command("install")
  .description("Installs the .stigmergy-core directory and creates a .roomodes file.")
  .action(async () => {
    const { install } = await import("./commands/install.js");
    await install();
  });

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

async function main() {
  try {
    // --- START: MODIFICATION ---
    // Run the check before parsing any commands, except for 'install' itself.
    const command = process.argv[2];
    if (command && command !== "install") {
      const canProceed = await runGuardianCheck();
      if (!canProceed) {
        process.exit(1);
      }
    }
    // --- END: MODIFICATION ---
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("❌ Unhandled exception in main:", err);
    process.exit(1);
  }
}

main();
