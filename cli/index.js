#!/usr/bin/env node

const { Command } = require("commander");
const installer = require("../installer/install");
const { runBuilder } = require("../builder/prompt_builder");
const engine = require("../engine/server");

const program = new Command();

program
  .name("stigmergy")
  .description("The command-line interface for the Pheromind Autonomous Development System.")
  .version(require("../package.json").version);

program
  .command("install")
  .description("Installs the Pheromind knowledge base and configures your IDE.")
  .action(async () => {
    await installer.run();
  });

program
  .command("start")
  .description("Starts the Pheromind Engine.")
  .option(
    "-g, --goal <filepath>",
    "Path to a text file containing the initial project goal to start autonomous mode."
  )
  .action((options) => {
    engine.start(options);
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

main();
