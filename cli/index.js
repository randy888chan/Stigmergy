#!/usr/bin/env node

const { Command } = require('commander');
const installer = require('../installer/install');
const { runBuilder } = require('../builder/prompt_builder');

const program = new Command();

program
  .name('stigmergy')
  .description('The command-line interface for the Pheromind Autonomous Development System.')
  .version(require('../package.json').version);

program
  .command('install')
  .description('Installs the Pheromind knowledge base and generates configuration files.')
  .action(async () => {
    await installer.run();
  });

program
  .command('start')
  .description('Starts the local Pheromind AI Engine as a background service.')
  .action(() => {
    console.log('Starting Pheromind Engine...');
    require('../engine/server.js');
  });
  
program
  .command('execute <blueprint_path>')
  .description('Executes a pre-approved blueprint file.')
  .action((blueprint_path) => {
      console.log(`Loading blueprint from: ${blueprint_path}`);
      // This is a placeholder for the logic that would kick off the engine
      // with a specific blueprint file.
      console.log('Starting execution engine...');
      // In a real implementation, you would pass this path to the engine process.
      require('../engine/server.js');
  });

program
  .command('build')
  .description('Builds self-contained prompt files for use in Web UIs.')
  .option('-a, --agent <agentId>', 'Build a single agent bundle by its ID.')
  .option('--all', 'Build all agents.')
  .action(async (options) => {
    await runBuilder(options);
  });

async function main() {
    await program.parseAsync(process.argv);
}

main();
