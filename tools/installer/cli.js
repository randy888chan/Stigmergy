#!/usr/bin/env node

const { Command } = require("commander");
const path = require("path");
const fs = require("fs-extra");

// Dynamic imports for ES modules
let chalk, inquirer;

async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
    inquirer = (await import("inquirer")).default;
  }
}

class Installer {
  constructor(config) {
    this.targetDir = path.resolve(process.cwd(), config.directory);
    this.sourceDir = path.resolve(__dirname, "../../.stigmergy-core");
  }

  async install() {
    await initializeModules();
    console.log(chalk.bold.cyan("🚀 Welcome to the Stigmergy Framework Installer!"));

    const coreDestDir = path.join(this.targetDir, ".stigmergy-core");

    if (await fs.pathExists(coreDestDir)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `The '${chalk.yellow(".stigmergy-core")}' directory already exists. Overwrite it?`,
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log(chalk.red("Installation cancelled."));
        return;
      }
    }

    try {
      console.log(`Installing Stigmergy core into ${this.targetDir}...`);
      await fs.copy(this.sourceDir, coreDestDir);
      console.log(chalk.green("\n✓ Stigmergy framework installed successfully!"));
      console.log(chalk.bold("\nTo get started:"));
      console.log(chalk.cyan("1. Open this project in your IDE."));
      console.log(chalk.cyan("2. Activate the chief strategist: `@saul`"));
      console.log(chalk.cyan("3. Give him your project goal, e.g., '*begin_project brief.md'"));
    } catch (error) {
      console.error(chalk.red("\nAn error occurred during installation:"));
      console.error(error.message);
      process.exit(1);
    }
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
    .description("Install the Stigmergy framework in the current project directory.")
    .action(async () => {
      const installer = new Installer({ directory: "." });
      await installer.install();
    });

  program.parse(process.argv);
}

main();
