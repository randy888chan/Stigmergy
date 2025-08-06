#!/usr/bin/env node

import { Command } from "commander";
import { createRequire } from "module";
import { SystemValidator } from "../src/bootstrap/system_validator.js";
import { HybridOrchestrator } from "../src/orchestration/hybrid_orchestrator.js";
import { main as startEngine } from "../engine/server.js";
import open from "open";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();

program
  .name("stigmergy")
  .description("Stigmergy 3.0: A Hybrid Autonomous System for development.")
  .version(pkg.version);

/**
 * The new, unified entry point for the system.
 * It validates the environment and starts the autonomous orchestration.
 */
program
  .command("bootstrap")
  .description("Bootstrap the entire Stigmergy system with validation and run orchestration.")
  .argument(
    "[goal]",
    "The high-level development goal to orchestrate.",
    "Create a simple portfolio site with React and a contact form."
  )
  .action(async (goal) => {
    console.log("🚀 Stigmergy 3.0 Bootstrap sequence initiated...");

    const validator = new SystemValidator();
    const health = await validator.comprehensiveCheck();

    const isSystemHealthy = !Object.values(health).some((r) => !r.success);

    if (isSystemHealthy) {
      console.log("\n✅ System is healthy. Starting autonomous orchestration...");
      const orchestrator = new HybridOrchestrator();
      const result = await orchestrator.orchestrateWithHybridApproach(goal);

      console.log("\n🎯 Orchestration Demo Completed:");
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.error("\n❌ System health checks failed. Bootstrap aborted.");
      console.error(
        "Please review the errors above. The system may have attempted to auto-repair some issues."
      );
      process.exit(1);
    }
  });

program
  .command("start")
  .description("Starts the Stigmergy engine server (MCP).")
  .action(async () => {
    await startEngine();
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

async function main() {
  // Set the default command to 'bootstrap' if no other command is provided
  if (process.argv.length <= 2) {
    process.argv.push("bootstrap");
  }
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("❌ Command failed:", err);
  process.exit(1);
});
