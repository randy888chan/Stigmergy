#!/usr/bin/env node

const fs = require("fs").promises;
const path = require("path");
const { glob } = require("glob");

// Dynamic imports for ES modules
let chalk, ora, inquirer;

async function initializeModules() {
  if (!chalk) chalk = (await import("chalk")).default;
  if (!ora) ora = (await import("ora")).default;
  if (!inquirer) inquirer = (await import("inquirer")).default;
}

class V3ToV4Upgrader {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.backup = options.backup !== false;
    this.projectPath = path.resolve(options.projectPath || process.cwd());
  }

  async upgrade() {
    await initializeModules();
    process.stdin.resume(); // Keep process alive for multiple prompts

    console.log(chalk.bold.cyan("\nWelcome to the Pheromind V3 to V4 Upgrader\n"));

    if (!(await this.validateV3Project())) {
        console.error(chalk.red("This does not appear to be a valid V3 project. Aborting."));
        console.error(chalk.red("Expected to find 'bmad-agent/' and 'docs/' directories."));
        process.exit(1);
    }
    
    const analysis = await this.analyzeProject();
    this.showPreflightCheck(analysis);

    const { confirm } = await inquirer.prompt([
        { type: "confirm", name: "confirm", message: "Do you want to proceed with the upgrade?", default: true }
    ]);

    if (!confirm) {
        console.log("Upgrade cancelled.");
        process.exit(0);
    }
    
    if (this.backup) await this.createBackup();
    await this.installV4Structure();
    await this.migrateDocuments(analysis);
    await this.setupIDE();
    this.showCompletionReport(analysis);
    
    process.exit(0);
  }

  async pathExists(p) {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
  
  async validateV3Project() {
      return (await this.pathExists(path.join(this.projectPath, "bmad-agent"))) && 
             (await this.pathExists(path.join(this.projectPath, "docs")));
  }

  async analyzeProject() {
    const docsPath = path.join(this.projectPath, "docs");
    const prdFile = (await glob("prd.md", { cwd: docsPath, case: true }))[0];
    const archFile = (await glob("architecture.md", { cwd: docsPath, case: true }))[0];
    const storyFiles = await glob("stories/*.md", { cwd: docsPath });
    return { prdFile, archFile, storyFiles: storyFiles.map(f => path.basename(f)) };
  }
  
  showPreflightCheck(analysis) {
    console.log(chalk.bold("\nProject Analysis:"));
    console.log(`- PRD: ${analysis.prdFile ? chalk.green('Found') : chalk.yellow('Not Found')}`);
    console.log(`- Architecture: ${analysis.archFile ? chalk.green('Found') : chalk.yellow('Not Found')}`);
    console.log(`- Stories: ${analysis.storyFiles.length > 0 ? chalk.green(`${analysis.storyFiles.length} found`) : chalk.yellow('None found')}`);
    console.log("\nThe following actions will be performed:");
    console.log("1. Backup 'bmad-agent/' and 'docs/' to '.bmad-v3-backup/'.");
    console.log("2. Install the new '.bmad-core/' directory structure.");
    console.log("3. Copy your existing documents into the new 'docs/' folder.");
  }

  async createBackup() {
    const spinner = ora("Creating backup...").start();
    const backupPath = path.join(this.projectPath, ".bmad-v3-backup");
    if (await this.pathExists(backupPath)) {
        spinner.fail(chalk.red("Backup directory '.bmad-v3-backup' already exists. Please remove it and try again."));
        process.exit(1);
    }
    await fs.mkdir(backupPath);
    await fs.rename(path.join(this.projectPath, "bmad-agent"), path.join(backupPath, "bmad-agent"));
    await fs.rename(path.join(this.projectPath, "docs"), path.join(backupPath, "docs"));
    spinner.succeed("Backup created at .bmad-v3-backup/");
  }

  async installV4Structure() {
    const spinner = ora("Installing new V4 structure...").start();
    const sourcePath = path.resolve(__dirname, "../../bmad-core");
    const destPath = path.join(this.projectPath, ".bmad-core");
    await fs.cp(sourcePath, destPath, { recursive: true });
    spinner.succeed("Installed new .bmad-core/ structure.");
  }
  
  async migrateDocuments(analysis) {
    const spinner = ora("Migrating project documents...").start();
    const backupDocsPath = path.join(this.projectPath, ".bmad-v3-backup", "docs");
    const newDocsPath = path.join(this.projectPath, "docs");
    await fs.mkdir(newDocsPath, { recursive: true });
    
    if (analysis.prdFile) await fs.copyFile(path.join(backupDocsPath, analysis.prdFile), path.join(newDocsPath, "prd.md"));
    if (analysis.archFile) await fs.copyFile(path.join(backupDocsPath, analysis.archFile), path.join(newDocsPath, "architecture.md"));
    
    if(analysis.storyFiles.length > 0){
        const newStoriesPath = path.join(newDocsPath, "stories");
        await fs.mkdir(newStoriesPath, {recursive: true});
        for(const story of analysis.storyFiles){
            await fs.copyFile(path.join(backupDocsPath, "stories", story), path.join(newStoriesPath, story));
        }
    }
    spinner.succeed("Documents migrated.");
  }
  
  async setupIDE() {
    const { ides } = await inquirer.prompt([{
      type: "checkbox",
      name: "ides",
      message: "Select IDEs to configure for V4 (Space to select, Enter to confirm):",
      choices: [{ name: "Roo Code (VS Code Extension)", value: "roo" }],
    }]);
    
    if(ides.length > 0){
        const ideSetup = require("../installer/lib/ide-setup");
        for(const ide of ides){
            await ideSetup.setup(ide, this.projectPath);
        }
    }
  }

  showCompletionReport() {
      console.log(chalk.bold.green("\n🎉 Upgrade to Pheromind V4 Complete! 🎉"));
      console.log(chalk.bold("\nNext Steps:"));
      console.log("1. Activate `@bmad-master` in your IDE.");
      console.log("2. Use the new `*ingest_docs` command to process your migrated documents.");
      console.log("   Saul will shard them and prepare the system for execution.");
      console.log("3. Once ingested, your project will be ready for the autonomous Pheromind Cycle.");
  }
}

// CLI execution
if (require.main === module) {
  const { Command } = require("commander");
  const program = new Command();
  
  program
    .command("upgrade", { isDefault: true })
    .description("Interactively upgrade a BMAD-METHOD V3 project to V4")
    .option("-p, --project <path>", "Path to your V3 project (defaults to current dir)")
    .action(async (options) => {
        const upgrader = new V3ToV4Upgrader({ projectPath: options.project });
        await upgrader.upgrade();
    });
    
  program.parse(process.argv);
}

module.exports = V3ToV4Upgrader;
