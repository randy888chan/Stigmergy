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
    const installer = require("../installer/install");
    await installer.run();
  });

program
  .command("start")
  .description("Starts the Stigmergy Engine in a dormant, listening state.")
  .action(() => {
    const engine = require("../engine/server");
    engine.start();
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

// NEW: Cleanup command
program
  .command("cleanup")
  .description("Invokes the @refactorer agent to scan for dead code and unused assets.")
  .action(() => {
      console.log("Invoking @refactorer agent for cleanup duty...");
      // This is a simplified invocation. A full implementation would message the running server.
      // For now, we log the instruction.
      console.log("To run cleanup, please ensure the server is running and send the following prompt to the '@rocco' agent:");
      console.log("Execute your JANITOR_PROTOCOL to scan the codebase for cleanup opportunities.");
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("Command failed:", err);
  process.exit(1);
});
