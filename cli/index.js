#!/usr/bin/env node

const { Command } = require("commander");
const program = new Command();

program
  .name("stigmergy")
  .description("The command-line interface for the Stigmergy Autonomous Development System.")
  .version(require("../package.json").version);

program
  .command("install")
  .description("Installs the Stigmergy knowledge base and configures your IDE.")
  .action(async () => {
    // This now uses an updated installer.
    const installer = require("../installer/install");
    await installer.run();
  });

program
  .command("start")
  .description("Starts the Stigmergy Engine. Use 'npm run stigmergy:start' for project integration.")
  .action(() => {
    console.log("This command is deprecated. Please use 'npm run stigmergy:start' to run the engine server.");
  });

program
  .command("build")
  .description("Builds self-contained prompt bundles for use in Web UIs.")
  .option("-t, --team <teamId>", "Build a bundle for a specific agent team.")
  .option("--all", "Build all agent teams.")
  .action(async (options) => {
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
