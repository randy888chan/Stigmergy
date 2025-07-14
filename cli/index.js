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
  .description('Installs the Pheromind knowledge base (.stigmergy-core) and configures the current project.')
  .action(async () => {
    await installer.run();
  });

program
  .command('start-engine')
  .description('Starts the local Pheromind AI Engine server.')
  .action(() => {
    require('../engine/server.js');
  });

program
  .command('index-code')
  .description('Runs the code graph indexer to populate the Neo4j database.')
  .action(() => {
    require('../indexer/index.js');
  });

program
  .command('build')
  .description('Builds self-contained prompt files for use in Web UIs (e.g., Gemini, Claude).')
  .option('-a, --agent <agentId>', 'Build a single agent bundle by its ID (e.g., mary).')
  .option('-t, --team <teamId>', 'Build a single team bundle by its ID (e.g., team-planning-crew).')
  .option('--all', 'Build all agents and teams.')
  .action(async (options) => {
    await runBuilder(options);
  });

async function main() {
    await program.parseAsync(process.argv);
}

main();
