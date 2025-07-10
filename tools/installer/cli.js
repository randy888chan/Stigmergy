#!/usr/bin/env node

const { Command } = require("commander");
const Installer = require("./lib/installer");

async function main() {
  const program = new Command();

  program
    .name("stigmergy")
    .description("Stigmergy: The Autonomous AI Development Swarm. Manage your AI-driven projects.")
    .version(require("../../package.json").version);

  program
    .command("install")
    .description("Install the Stigmergy framework in the current project directory.")
    .option('--ide <ide_name>', 'Specify a single IDE to configure non-interactively (e.g., roo).')
    .action(async (options) => {
      const installer = new Installer({
        directory: ".",
        cliOptions: options
      });
      await installer.install();
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("\nAn unexpected error occurred in the CLI:", err);
  process.exit(1);
});
