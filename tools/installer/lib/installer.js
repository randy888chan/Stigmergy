const path = require("node:path");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const ideSetup = require("./ide-setup");

// Dynamic imports for ES modules
let chalk, ora, inquirer;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
    ora = (await import("ora")).default;
    inquirer = (await import("inquirer")).default;
  }
}

class Installer {
  async install(config) {
    // Initialize ES modules
    await initializeModules();
    
    const spinner = ora("Analyzing installation directory...").start();

    try {
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      let installDir = path.isAbsolute(config.directory) 
        ? config.directory 
        : path.resolve(originalCwd, config.directory);
        
      if (path.basename(installDir) === '.stigmergy-core') {
        installDir = path.dirname(installDir);
      }
      
      spinner.text = `Verifying target directory: ${installDir}`;

      if (!(await fileManager.pathExists(installDir))) {
        spinner.stop();
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: `Directory ${chalk.bold(installDir)} does not exist. Create it?`,
            choices: ['Yes', 'No']
          }
        ]);

        if (action === 'No') {
          console.log(chalk.red('Installation cancelled.'));
          process.exit(0);
        } else {
          await fileManager.ensureDirectory(installDir);
        }
        spinner.start("Rerunning analysis...");
      }

      const state = await this.detectInstallationState(installDir);

      switch (state.type) {
        case "clean":
          return await this.performFreshInstall(config, installDir, spinner);
        case "stigmergy_existing":
          return await this.handleExistingInstallation(config, installDir, state, spinner);
        case "legacy_existing":
          return await this.handleLegacyInstallation(config, installDir, state, spinner);
        case "unknown_existing":
          return await this.handleUnknownInstallation(config, installDir, state, spinner);
      }
    } catch (error) {
      spinner.fail("Installation failed");
      throw error;
    }
  }

  async detectInstallationState(installDir) {
    const stigmergyCorePath = path.join(installDir, ".stigmergy-core");
    if (await fileManager.pathExists(stigmergyCorePath)) {
      return { type: "stigmergy_existing" };
    }
    if (await fileManager.pathExists(path.join(installDir, "bmad-agent"))) {
      return { type: "legacy_existing" };
    }
    const files = require("glob").sync("**/*", { cwd: installDir, nodir: true, dot: false, ignore: ["**/.git/**", "**/node_modules/**"] });
    if (files.length > 0) {
      return { type: "unknown_existing" };
    }
    return { type: "clean" };
  }

  async performFreshInstall(config, installDir, spinner) {
    spinner.text = "Starting fresh Stigmergy installation...";
    const sourceDir = configLoader.getStigmergyCorePath();
    const destDir = path.join(installDir, ".stigmergy-core");
    await fileManager.copyDirectory(sourceDir, destDir);
    
    const ides = config.ides || [];
    for (const ide of ides) {
      spinner.text = `Setting up ${ide} integration...`;
      await ideSetup.setup(ide, installDir);
    }

    spinner.succeed("Installation complete!");
    this.showSuccessMessage(installDir);
  }

  async handleExistingInstallation(config, installDir, state, spinner) {
    spinner.stop();
    const { action } = await inquirer.prompt([{
      type: "list",
      name: "action",
      message: "An existing Stigmergy installation was found. What would you like to do?",
      choices: [ "Update the core framework", "Reinstall (overwrite everything)", "Cancel" ],
    }]);

    if (action === "Update the core framework" || action === "Reinstall (overwrite everything)") {
      await this.performReinstall(config, installDir, spinner);
    } else {
      console.log("Installation cancelled.");
    }
  }
  
  async performReinstall(config, installDir, spinner){
    spinner.start("Reinstalling Stigmergy framework...");
    const corePath = path.join(installDir, ".stigmergy-core");
    await fileManager.removeDirectory(corePath);
    await this.performFreshInstall(config, installDir, spinner);
  }

  async handleLegacyInstallation(config, installDir, state, spinner) {
    spinner.stop();
    // Logic for upgrading from v3 can be handled by the 'upgrade' command.
    console.log(chalk.yellow("\nFound a legacy installation."));
    console.log(`Please run \`npx stigmergy upgrade\` to migrate your project.`);
  }

  async handleUnknownInstallation(config, installDir, state, spinner) {
    spinner.stop();
    const { action } = await inquirer.prompt([{
        type: "list",
        name: "action",
        message: "This directory contains files not related to Stigmergy. Install anyway?",
        choices: [ { name: "Yes, install alongside existing files", value: "force" }, { name: "No, cancel", value: "cancel" } ],
    }]);
    if(action === "force") await this.performFreshInstall(config, installDir, spinner);
    else console.log("Installation cancelled.");
  }
  
  showSuccessMessage(installDir) {
    console.log(chalk.green("\n✓ Stigmergy framework installed successfully!"));
    console.log(chalk.bold("\nTo get started:"));
    console.log(chalk.cyan("1. Open this project in your configured IDE."));
    console.log(chalk.cyan("2. Activate the master agent: `@stigmergy-master` (or select from Roo Code modes)."));
    console.log(chalk.cyan("3. Give him your project goal, e.g., 'Begin project from docs/brief.md'"));
  }
}

module.exports = new Installer();
