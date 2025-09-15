#!/usr/bin/env node
import { Command } from "commander";
import { createRequire } from "module";
import { SystemValidator } from "../src/bootstrap/system_validator.js";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { CoreBackup } from "../services/core_backup.js";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const coreBackup = new CoreBackup();

// Define available commands for suggestions
const availableCommands = [
  'start',
  'start --power',
  'install',
  'install --with-mcp',
  'install --mcp-only',
  'restore',
  'validate',
  'build',
  'mcp',
  'mcp -p <path>',
  'interactive',
  'help',
  'exit',
  'quit'
];

// Function to find similar commands using Levenshtein distance
function levenshteinDistance(str1, str2) {
  const matrix = Array(str2.length + 1).fill().map(() => Array(str1.length + 1).fill(0));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // insertion
        matrix[j - 1][i] + 1,     // deletion
        matrix[j - 1][i - 1] + cost  // substitution
      );
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Function to find similar commands
function findSimilarCommands(input, commands, maxDistance = 3) {
  const distances = commands.map(command => ({
    command,
    distance: levenshteinDistance(input, command.split(' ')[0]) // Compare with first word only
  }));
  
  return distances
    .filter(({ distance }) => distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 3)
    .map(({ command }) => command);
}

async function runGuardianCheck() {
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  if (await fs.pathExists(corePath)) return true;
  console.warn(chalk.yellow("⚠️ .stigmergy-core not found. Attempting to restore from latest backup..."));
  if (await coreBackup.restoreLatest()) {
    console.log(chalk.green("✅ Successfully restored .stigmergy-core from backup."));
    return true;
  }
  console.error(chalk.red("❌ Restore failed. Please run 'npx stigmergy install'."));
  return false;
}

const require = createRequire(import.meta.url);
const pkg = require("../package.json");

const program = new Command();
program.name("stigmergy").version(pkg.version);

program
  .command("start")
  .description("Starts the Stigmergy engine server in the current directory.")
  .option('--power', 'Run in Power Mode, requiring a connection to the Archon server.')
  .action(async (options) => {
    console.log(chalk.blue("Booting Stigmergy Engine..."));
    
    // CRITICAL FIX: Use an absolute path to the engine server based on this script's location
    const enginePath = path.resolve(__dirname, '../engine/server.js');
    
    try {
        const { Engine } = await import(enginePath);
        const engine = new Engine({ isPowerMode: options.power });
        if (await engine.initialize()) {
          await engine.start();
        } else {
          console.error(chalk.red("Engine initialization failed critical checks. Aborting startup."));
          process.exit(1);
        }
    } catch (e) {
        console.error(chalk.red("Failed to load the Stigmergy engine."), e);
        process.exit(1);
    }
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy start');
    console.log('  $ stigmergy start --power');
    console.log('');
    console.log('The server will start on port 3010 by default.');
    console.log('Access the dashboard at http://localhost:3010');
  });

program
  .command("install")
  .description("Installs the Stigmergy core files into the current directory.")
  .option('--with-mcp', 'Also install MCP server for IDE integration')
  .option('--mcp-only', 'Install only MCP server (no core files)')
  .action(async (options) => {
    const installPath = path.resolve(__dirname, './commands/install.js');
    const { install } = await import(installPath);
    await install(options);
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy install');
    console.log('  $ stigmergy install --with-mcp');
    console.log('  $ stigmergy install --mcp-only');
    console.log('');
    console.log('This command sets up the .stigmergy-core directory with');
    console.log('all necessary agent definitions and configuration files.');
  });

program
  .command("restore")
  .description("Restores the .stigmergy-core from the latest backup.")
  .action(async () => {
    const restorePath = path.resolve(__dirname, './commands/restore.js');
    const { default: restore } = await import(restorePath);
    await restore();
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy restore');
    console.log('');
    console.log('This command looks for the most recent backup in the');
    console.log('.stigmergy-backups directory and restores it to');
    console.log('.stigmergy-core.');
  });

program
  .command("validate")
  .description("Runs a system health check on the local installation.")
  .action(async () => {
    const validator = new SystemValidator();
    await validator.comprehensiveCheck();
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy validate');
    console.log('');
    console.log('This command checks:');
    console.log('  - Environment variables');
    console.log('  - Required dependencies');
    console.log('  - Core file integrity');
    console.log('  - Network connectivity');
  });

program
  .command("build")
  .description("Builds web agent bundles for ChatGPT/Gemini brainstorming.")
  .action(async () => {
    const buildPath = path.resolve(__dirname, './commands/build.js');
    const { default: build } = await import(buildPath);
    await build();
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy build');
    console.log('');
    console.log('This command creates optimized bundles of your agents');
    console.log('for use with web-based AI assistants.');
  });

program
  .command("mcp")
  .description("Setup MCP server for IDE integration (Roo Code, VS Code, etc.)")
  .option('-p, --project <path>', 'Target project directory (default: current directory)')
  .action(async (options) => {
    const mcpPath = path.resolve(__dirname, './commands/mcp.js');
    const { setupMCP } = await import(mcpPath);
    const targetDir = options.project || process.cwd();
    await setupMCP(targetDir);
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy mcp');
    console.log('  $ stigmergy mcp -p ./my-project');
    console.log('');
    console.log('This command sets up the Model Context Protocol server');
    console.log('that allows IDEs to communicate with Stigmergy agents.');
  });

program
  .command("interactive")
  .description("Start interactive mode with guided prompts")
  .action(async () => {
    console.log(chalk.blue("🚀 Welcome to Stigmergy Interactive Mode!"));
    console.log(chalk.gray("Type 'exit' or 'quit' to leave interactive mode.\n"));
    
    while (true) {
      const { command } = await inquirer.prompt([
        {
          type: 'input',
          name: 'command',
          message: chalk.green('stigmergy>'),
          prefix: ''
        }
      ]);
      
      if (command.toLowerCase() === 'exit' || command.toLowerCase() === 'quit') {
        console.log(chalk.blue("👋 Goodbye!"));
        break;
      }
      
      if (command.trim() === '') {
        continue;
      }
      
      // Parse the command and execute it
      const args = command.split(' ');
      try {
        await program.parseAsync(['node', 'stigmergy', ...args]);
      } catch (err) {
        // Check if this might be a typo and suggest similar commands
        const similar = findSimilarCommands(args[0], availableCommands);
        if (similar.length > 0) {
          console.log(chalk.yellow(`\nDid you mean one of these commands?`));
          similar.forEach((cmd) => {
            console.log(chalk.yellow(`  ${cmd}`));
          });
          console.log(chalk.gray(`Type 'help' to see all available commands.\n`));
        }
        console.error(chalk.red("❌ Error:"), err.message);
      }
      
      console.log(); // Add a blank line for readability
    }
  })
  .on('--help', () => {
    console.log('');
    console.log('Examples:');
    console.log('  $ stigmergy interactive');
    console.log('');
    console.log('This command starts an interactive shell where you can');
    console.log('enter Stigmergy commands without the "stigmergy" prefix.');
    console.log('Type "help" within the interactive mode to see available commands.');
  });

// Override the default help command to add examples
program.on('--help', () => {
  console.log('');
  console.log('Examples:');
  console.log('  $ stigmergy --help');
  console.log('  $ stigmergy start');
  console.log('  $ stigmergy install');
  console.log('  $ stigmergy interactive');
  console.log('');
  console.log('For detailed help on a specific command, use:');
  console.log('  $ stigmergy <command> --help');
});

async function main() {
  try {
    const command = process.argv[2];
    // The guardian check should only run if a stigmergy command that REQUIRES a core is run.
    // 'install' does not require one to exist beforehand.
    if (command && command !== "install" && command !== "interactive") {
      if (!await runGuardianCheck()) {
        process.exit(1);
      }
    }
    await program.parseAsync(process.argv);
  } catch (err) {
    console.error("❌ Unhandled CLI exception:", err);
    process.exit(1);
  }
}

main();