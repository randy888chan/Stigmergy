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
      // Store the original CWD where npx was executed
      const originalCwd = process.env.INIT_CWD || process.env.PWD || process.cwd();
      
      // Resolve installation directory relative to where the user ran the command
      let installDir = path.isAbsolute(config.directory) 
        ? config.directory 
        : path.resolve(originalCwd, config.directory);
        
      if (path.basename(installDir) === '.bmad-core') {
        // If user points directly to .bmad-core, treat its parent as the project root
        installDir = path.dirname(installDir);
      }
      
      spinner.text = `Verifying target directory: ${installDir}`;

      // Check if directory exists and handle non-existent directories
      if (!(await fileManager.pathExists(installDir))) {
        spinner.stop();
        console.log(chalk.yellow(`\nThe directory ${chalk.bold(installDir)} does not exist.`));
        
        const { action } = await inquirer.prompt([
          {
            type: 'list',
            name: 'action',
            message: 'What would you like to do?',
            choices: [
              { name: 'Create the directory and continue', value: 'create' },
              { name: 'Cancel installation', value: 'cancel' }
            ]
          }
        ]);

        if (action === 'cancel') {
          console.log(chalk.red('Installation cancelled.'));
          process.exit(0);
        } else if (action === 'create') {
          await fileManager.ensureDirectory(installDir);
          console.log(chalk.green(`✓ Created directory: ${installDir}`));
        }
        spinner.start("Rerunning analysis...");
      }

      // Detect current state
      const state = await this.detectInstallationState(installDir);

      // Handle different states
      switch (state.type) {
        case "clean":
          return await this.performFreshInstall(config, installDir, spinner);
        case "v4_existing":
          return await this.handleExistingV4Installation(config, installDir, state, spinner);
        case "v3_existing":
          return await this.handleV3Installation(config, installDir, state, spinner);
        case "unknown_existing":
          return await this.handleUnknownInstallation(config, installDir, state, spinner);
      }
    } catch (error) {
      spinner.fail("Installation failed");
      throw error;
    }
  }

  async detectInstallationState(installDir) {
    await initializeModules();
    const state = { type: "clean", manifest: null };

    const bmadCorePath = path.join(installDir, ".bmad-core");
    const manifestPath = path.join(bmadCorePath, "install-manifest.yml");

    if (await fileManager.pathExists(manifestPath)) {
      state.type = "v4_existing";
      state.manifest = await fileManager.readManifest(installDir);
      return state;
    }

    if (await fileManager.pathExists(path.join(installDir, "bmad-agent"))) {
      state.type = "v3_existing";
      return state;
    }
    
    const glob = require("glob");
    const files = glob.sync("**/*", { cwd: installDir, nodir: true, ignore: ["**/.git/**", "**/node_modules/**"] });
    if (files.length > 0) {
      state.type = "unknown_existing";
    }

    return state;
  }

  async performFreshInstall(config, installDir, spinner) {
    spinner.text = "Starting fresh installation...";
    const sourceDir = configLoader.getBmadCorePath();
    const bmadCoreDestDir = path.join(installDir, ".bmad-core");
    await fileManager.copyDirectory(sourceDir, bmadCoreDestDir);

    const glob = require("glob");
    const files = glob.sync("**/*", { cwd: bmadCoreDestDir, nodir: true }).map(file => path.join(".bmad-core", file));
    
    const ides = config.ides || [];
    if (ides.length > 0) {
      for (const ide of ides) {
        spinner.text = `Setting up ${ide} integration...`;
        await ideSetup.setup(ide, installDir);
      }
    }

    spinner.text = "Creating installation manifest...";
    await fileManager.createManifest(installDir, config, files);

    spinner.succeed("Installation complete!");
    this.showSuccessMessage(config, installDir);
  }

  async handleExistingV4Installation(config, installDir, state, spinner) {
    spinner.stop();
    console.log(chalk.yellow("\n🔍 Found existing Pheromind V4 installation."));
    const { action } = await inquirer.prompt([{
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        { name: `Update existing installation (Version: ${state.manifest.version})`, value: "update" },
        { name: "Reinstall (overwrite all framework files)", value: "reinstall" },
        { name: "Cancel", value: "cancel" },
      ],
    }]);

    if (action === "update") await this.performUpdate(config, installDir, state.manifest, spinner);
    else if (action === "reinstall") await this.performReinstall(config, installDir, spinner);
    else console.log("Installation cancelled.");
  }

  async handleV3Installation(config, installDir, state, spinner) {
    spinner.stop();
    console.log(chalk.yellow("\n🔍 Found legacy BMAD V3 installation."));
    const { action } = await inquirer.prompt([{
        type: "list",
        name: "action",
        message: "What would you like to do?",
        choices: [
          { name: "Upgrade to Pheromind V4 (recommended)", value: "upgrade" },
          { name: "Cancel", value: "cancel" },
        ],
    }]);
    
    if (action === "upgrade") {
      const V3ToV4Upgrader = require("../../upgraders/v3-to-v4-upgrader");
      const upgrader = new V3ToV4Upgrader({ projectPath: installDir });
      await upgrader.upgrade();
    } else {
      console.log("Installation cancelled.");
    }
  }

  async handleUnknownInstallation(config, installDir, state, spinner) {
    spinner.stop();
    console.log(chalk.yellow("\n⚠️  Target directory is not empty."));
     const { action } = await inquirer.prompt([{
        type: "list",
        name: "action",
        message: "This directory contains files not related to Pheromind. How to proceed?",
        choices: [
          { name: "Install anyway (will add .bmad-core folder)", value: "force" },
          { name: "Cancel", value: "cancel" },
        ],
    }]);

    if(action === "force") await this.performFreshInstall(config, installDir, spinner);
    else console.log("Installation cancelled.");
  }

  async performUpdate(newConfig, installDir, manifest, spinner) {
    spinner.start("Updating Pheromind framework...");
    // A simple update is now just a reinstall, as reinstall logic is safe.
    await this.performReinstall(newConfig, installDir, spinner);
  }

  async performReinstall(config, installDir, spinner) {
    spinner.start("Performing reinstall...");
    const bmadCorePath = path.join(installDir, ".bmad-core");
    await fileManager.removeDirectory(bmadCorePath);
    await this.performFreshInstall(config, installDir, spinner);
  }

  showSuccessMessage(config, installDir) {
    console.log(chalk.green("\n✓ Pheromind framework installed successfully!"));
    console.log(chalk.bold("\nTo get started:"));
    console.log(chalk.cyan("1. Open this project in your configured IDE."));
    console.log(chalk.cyan("2. Activate the master agent: `@bmad-master`"));
    console.log(chalk.cyan("3. Give him your project goal, e.g., 'Begin project from docs/brief.md'"));
  }
}

module.exports = new Installer();
