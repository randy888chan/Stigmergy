#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const Installer = require("./lib/installer");
const V3ToV4Upgrader = require("../../tools/upgraders/v3-to-v4-upgrader");

// Dynamic imports for ES modules
let chalk, inquirer;

async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
    inquirer = (await import("inquirer")).default;
  }
}

async function main() {
  await initializeModules();
  const program = new Command();

  program
    .name("stigmergy")
    .description("Stigmergy: The Autonomous AI Development Swarm. Manage your AI-driven projects.")
    .version(require("../../package.json").version);

  program
    .command("install")
    .description("Install the Stigmergy framework in a new project directory.")
    .option("-d, --directory <path>", "Target directory for installation", ".")
    .action(async (options) => {
      try {
        console.log(chalk.bold.cyan("🚀 Welcome to the Stigmergy Framework Installer!"));
        console.log("This will set up your project for autonomous AI development.");

        const { ides } = await inquirer.prompt([
          {
            type: "checkbox",
            name: "ides",
            message: "Select IDEs to configure for Stigmergy (Space to select, Enter to confirm):",
            choices: [
              { name: "Roo Code (VS Code Extension)", value: "roo", checked: true },
              { name: "Cursor", value: "cursor" },
            ],
          },
        ]);

        const config = {
          directory: options.directory,
          installType: "full", // Default to a complete, unified install
          ides,
        };
        
        await Installer.install(config);

      } catch (error) {
        console.error(chalk.red("\nAn error occurred during installation:"));
        console.error(error.message);
        process.exit(1);
      }
    });
    
  program
    .command("upgrade")
    .description("Upgrade an existing legacy project to the Stigmergy architecture.")
    .option("-p, --project <path>", "Path to your project (defaults to current dir)")
    .action(async (options) => {
      // This can be adapted to handle different legacy versions if needed
      const upgrader = new V3ToV4Upgrader({ projectPath: options.project });
      await upgrader.upgrade();
    });

  program.parse(process.argv);
}

main();
