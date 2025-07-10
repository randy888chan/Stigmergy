const path = require("node:path");
const fs = require("fs-extra");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const ideSetup = require("./ide-setup");

// Use a class to hold state and dependencies
class Installer {
  constructor(config) {
    this.targetDir = path.resolve(process.cwd(), config.directory);
    this.sourceDir = path.resolve(__dirname, "..", "..", ".stigmergy-core");
    this.cliOptions = config.cliOptions || {};
    this.chalk = null;
    this.inquirer = null;
    this.ora = null;
  }

  async _initializeDeps() {
    if (!this.chalk) {
      this.chalk = (await import("chalk")).default;
      this.inquirer = (await import("inquirer")).default;
      this.ora = (await import("ora")).default;
    }
  }

  async install() {
    await this._initializeDeps();
    console.log(this.chalk.bold.cyan("🚀 Welcome to the Stigmergy Framework Installer!"));

    const coreDestDir = path.join(this.targetDir, ".stigmergy-core");

    if (await fs.pathExists(coreDestDir)) {
      const { overwrite } = await this.inquirer.prompt([
        {
          type: "confirm",
          name: "overwrite",
          message: `The '${this.chalk.yellow(".stigmergy-core")}' directory already exists. Overwrite it?`,
          default: false,
        },
      ]);
      if (!overwrite) {
        console.log(this.chalk.red("Installation cancelled."));
        return;
      }
    }

    const spinner = this.ora(`Installing Stigmergy core into ${this.targetDir}...`).start();
    try {
      await fs.copy(this.sourceDir, coreDestDir);
      spinner.succeed("Stigmergy core installed successfully!");

      // --- START: NEW INTERACTIVE IDE SETUP LOGIC ---
      let idesToSetup = [];
      if (this.cliOptions.ide) {
        // Non-interactive mode if --ide flag is used
        idesToSetup.push(this.cliOptions.ide);
        console.log(this.chalk.cyan(`\nConfiguring for specified IDE: ${this.cliOptions.ide}`));
      } else {
        // Interactive mode
        const availableIdes = await configLoader.listAvailableIdes();
        const { selectedIdes } = await this.inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedIdes',
            message: 'Which IDE(s) would you like to configure for Stigmergy?',
            choices: availableIdes.map(ide => ({ name: ide.name, value: ide.id })),
            default: ['roo'] // Default to selecting Roo Code
          }
        ]);
        idesToSetup = selectedIdes;
      }

      if (idesToSetup.length > 0) {
        spinner.start("Configuring IDE integrations...");
        for (const ideId of idesToSetup) {
          await ideSetup.setup(ideId, this.targetDir);
        }
        spinner.succeed("IDE integrations configured!");
      }
      // --- END: NEW INTERACTIVE IDE SETUP LOGIC ---

      console.log(this.chalk.green.bold("\n✓ Stigmergy framework is ready!"));
      console.log(this.chalk.bold("\nTo get started:"));
      console.log(this.chalk.cyan("1. Open this project in your configured IDE."));
      console.log(this.chalk.cyan("2. Activate the chief strategist (e.g., `@saul` or `@winston`)."));
      console.log(this.chalk.cyan("3. Give your agent a project goal."));

    } catch (error) {
      spinner.fail("An error occurred during installation.");
      console.error(this.chalk.red(error.message));
      process.exit(1);
    }
  }
}

module.exports = Installer;
