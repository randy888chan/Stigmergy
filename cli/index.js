#!/usr/bin/env node

import { Command } from "commander";
import pkg from "../package.json" assert { type: "json" };
import { run as runInstaller } from "../installer/install.js";
import { runBuilder } from "../builder/prompt_builder.js";

const program = new Command();

program
  .name("stigmergy")
  .description("The command-line interface for the Stigmergy Autonomous Development System.")
  .version(pkg.version);

program
  .command("install")
  .description("Installs the Stigmergy knowledge base and configures your IDE.")
  .action(async () => {
    await runInstaller();
  });

program
  .command("start")
  .description(
    "Starts the Stigmergy Engine. Use 'npm run stigmergy:start' for project integration."
  )
  .action(() => {
    console.log(
      "This command is deprecated. Please use 'npm run stigmergy:start' to run the engine server."
    );
  });

program
  .command("build")
  .description("Builds self-contained prompt bundles for use in Web UIs.")
  .option("-t, --team <teamId>", "Build a bundle for a specific agent team.")
  .option("--all", "Build all agent teams.")
  .action(async (options) => {
    await runBuilder(options);
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("Command failed:", err);
  process.exit(1);
});
