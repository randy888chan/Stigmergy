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
  .action(installer.run);

program
  .command("start")
  .description("Starts the Pheromind Engine.")
  .option("-g, --goal <filepath>", "Path to a text file with the project goal to start autonomous mode.")
  .action(engine.start);

program
  .command("build")
  .description("Builds self-contained prompt bundles for use in Web UIs.")
  .option("-t, --team <teamId>", "Build a bundle for a specific agent team.")
  .option("--all", "Build all agent teams.")
  .action(runBuilder);

program.parseAsync(process.argv).catch(err => {
    console.error("Command failed:", err);
    process.exit(1);
});
