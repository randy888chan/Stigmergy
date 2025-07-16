#!/usr/bin/env node

const { Command } = require("commander");

const program = new Command();

program
  .name("stigmergy")
  .description("The command-line interface for the Pheromind Autonomous Development System.")
  .version(require("../package.json").version);

program
  .command("install")
  .description("Installs the Pheromind knowledge base and configures your IDE.")
  .action(async () => {
    // Lazy load the installer only when this command is run
    const installer = require("../installer/install");
    await installer.run();
  });

program
  .command("start")
  .description("Starts the Pheromind Engine in a dormant, listening state.")
  .action(() => {
    // Lazy load the engine only when this command is run
    const engine = require("../engine/server");
    engine.start();
  });

program
  .command("build")
  .description("Builds self-contained prompt bundles for use in Web UIs.")
  .option("-t, --team <teamId>", "Build a bundle for a specific agent team.")
  .option("--all", "Build all agent teams.")
  .action(async (options) => {
    // Lazy load the builder only when this command is run
    const { runBuilder } = require("../builder/prompt_builder");
    await runBuilder(options);
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("Command failed:", err);
  process.exit(1);
});
