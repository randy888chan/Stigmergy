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
  'run',
  'start',
  'start --power',
  'init',
  'init --interactive',
  'start-service',
  'stop-service',
  'service-status',
  'restore',
  'validate',
  'build',
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
  .addHelpText('after', `
Examples:
  $ stigmergy start
  $ stigmergy start --power

The server will start on port 3010 by default.
Access the dashboard at http://localhost:3010
  `);

program
  .command("init")
  .description("Initialize Stigmergy in the current project directory.")
  .option('--interactive', 'Interactive initialization with guided setup')
  .option('--no-interactive', 'Run in non-interactive mode, skipping all prompts')
  .action(async (options) => {
    const initPath = path.resolve(__dirname, './commands/init.js');
    const { init, interactiveInit } = await import(initPath);
    if (options.interactive) {
      await interactiveInit();
    } else {
      await init(options);
    }
  })
  .addHelpText('after', `
Examples:
  $ stigmergy init
  $ stigmergy init --interactive

This command creates a .stigmergy directory in the current project
with configuration files and directories for trajectories,
evaluations, and state management.
  `);

program
  .command("setup")
  .description("Runs the interactive setup wizard to initialize and configure Stigmergy.")
  .action(async () => {
    const setupPath = path.resolve(__dirname, './commands/setup.js');
    const { setup } = await import(setupPath);
    await setup();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy setup

This command starts an interactive wizard that helps you:
  - Initialize the project
  - Configure API keys
  - Run a health check
  - Start the Stigmergy service
  `);

program
  .command("validate")
  .description("Runs a system health check on the local installation.")
  .action(async () => {
    const validator = new SystemValidator();
    await validator.comprehensiveCheck();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy validate

This command checks:
  - Environment variables
  - Required dependencies
  - Core file integrity
  - Network connectivity
  `);

program
  .command("start-service")
  .description("Start the Stigmergy global service.")
  .action(async () => {
    const servicePath = path.resolve(__dirname, './commands/service.js');
    const { startService } = await import(servicePath);
    await startService();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy start-service

This command starts the Stigmergy service as a background process.
The service will run on port 3010 and can be accessed by any project.
  `);

program
  .command("stop-service")
  .description("Stop the Stigmergy global service.")
  .action(async () => {
    const servicePath = path.resolve(__dirname, './commands/service.js');
    const { stopService } = await import(servicePath);
    await stopService();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy stop-service

This command stops the Stigmergy service.
  `);

program
  .command("service-status")
  .description("Check the status of the Stigmergy global service.")
  .action(async () => {
    const servicePath = path.resolve(__dirname, './commands/service.js');
    const { serviceStatus } = await import(servicePath);
    await serviceStatus();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy service-status

This command checks if the Stigmergy service is running.
  `);

program
  .command("build")
  .description("Builds web agent bundles for ChatGPT/Gemini brainstorming.")
  .action(async () => {
    const buildPath = path.resolve(__dirname, './commands/build.js');
    const { default: build } = await import(buildPath);
    await build();
  })
  .addHelpText('after', `
Examples:
  $ stigmergy build

This command creates optimized bundles of your agents
for use with web-based AI assistants.
  `);


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
  .addHelpText('after', `
Examples:
  $ stigmergy interactive

This command starts an interactive shell where you can
enter Stigmergy commands without the "stigmergy" prefix.
Type "help" within the interactive mode to see available commands.
  `);

program
  .command("run")
  .description("Run a new mission with a specified goal or start an interactive chat session.")
  .option('-g, --goal <goal>', 'The high-level goal for the mission')
  .action(async (options) => {
    const runPath = path.resolve(__dirname, './commands/run.js');
    const { handler } = await import(runPath);
    // Commander passes the options object directly, which matches the 'argv' expected by the yargs-style handler.
    await handler(options);
  })
  .addHelpText('after', `
Examples:
  $ stigmergy run
  $ stigmergy run --goal "Fix the authentication bug"
  $ stigmergy run -g "Implement feature X"

If a goal is provided, this command sends the goal to the running Stigmergy service and streams the mission status.
If no goal is provided, it starts an interactive chat session with the service.
  `);

program
  .command("add-tool")
  .description("Creates a new custom tool boilerplate file.")
  .option('--name <name>', 'The name of the new tool file (e.g., my_tool)')
  .action(async (options) => {
    const addToolPath = path.resolve(__dirname, './commands/add-tool.js');
    const { addTool } = await import(addToolPath);
    await addTool(options);
  })
  .addHelpText('after', `
Examples:
  $ stigmergy add-tool --name "my_custom_tool"

This command creates a boilerplate file in the custom tools directory
(defined by 'custom_tools_path' in stigmergy.config.js).
  `);

program
  .command("add-agent")
  .description("Creates a new custom agent definition file.")
  .option('--name <name>', 'The name of the new agent (e.g., my_agent)')
  .option('--force', 'Force overwrite of existing agent file')
  .action(async (options) => {
    const addAgentPath = path.resolve(__dirname, './commands/add-agent.js');
    const { addAgent } = await import(addAgentPath);
    await addAgent(options);
  })
  .addHelpText('after', `
Examples:
  $ stigmergy add-agent --name "my_analyst"

This command creates a boilerplate agent definition file in the custom agents directory
(defined by 'custom_agents_path' in stigmergy.config.js).
  `);

program
    .command("export-knowledge")
    .description("Exports the entire knowledge graph to a .cypher file.")
    .action(async () => {
        const exportPath = path.resolve(__dirname, './commands/export-knowledge.js');
        const { exportKnowledge } = await import(exportPath);
        await exportKnowledge();
    })
    .addHelpText('after', `
Examples:
    $ stigmergy export-knowledge

This command contacts a running Stigmergy engine and requests a full dump of the Neo4j learning graph.
The output is saved to a timestamped .cypher file in the project's root directory.
    `);

program
    .command("import-knowledge")
    .description("Imports a knowledge graph from a .cypher file.")
    .option('--file <file>', 'The path to the .cypher file to import.')
    .action(async (options) => {
        const importPath = path.resolve(__dirname, './commands/import-knowledge.js');
        const { importKnowledge } = await import(importPath);
        await importKnowledge(options);
    })
    .addHelpText('after', `
Examples:
    $ stigmergy import-knowledge --file ./knowledge-export-20231027.cypher

This command reads a .cypher script and sends it to a running Stigmergy engine to populate the Neo4j database.
    `);

// Register commands from external files
import { createLoginCommand } from './commands/login.js';
import { createAdminCommand } from './commands/admin.js';
program.addCommand(createLoginCommand());
program.addCommand(createAdminCommand());

// Override the default help command to add examples
program.addHelpText('after', `
Examples:
  $ stigmergy --help
  $ stigmergy start
  $ stigmergy install
  $ stigmergy interactive

For detailed help on a specific command, use:
  $ stigmergy <command> --help
`);

async function main() {
  try {
    const command = process.argv[2];
    // The guardian check should only run if a stigmergy command that REQUIRES a core is run.
    // 'init', 'start-service', 'stop-service', 'service-status' do not require one to exist beforehand.
    const commandsWithoutGuardian = ["run", "init", "start-service", "stop-service", "service-status", "interactive"];
    if (command && !commandsWithoutGuardian.includes(command)) {
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