#!/usr/bin/env node

const { Command } = require('commander');
const path = require('path');
const fs = require('fs-extra');
const installer = require('../installer/install');

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
    // We require it here to start the server process
    require('../engine/server.js');
  });

program
  .command('index-code')
  .description('Runs the code graph indexer to populate the Neo4j database.')
  .action(() => {
    // We require it here to start the indexer process
    require('../indexer/index.js');
  });

async function main() {
    await program.parseAsync(process.argv);
}

main();
