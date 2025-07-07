#!/usr/bin/env node

const { Command } = require('commander');
const WebBuilder = require('./builders/web-builder');

const program = new Command();

program
  .name('stigmergy-cli')
  .description('Stigmergy: CLI for managing the Autonomous AI Development Swarm.')
  .version(require('../package.json').version);

program
  .command('build')
  .description('Build web bundles for agents and teams from the .stigmergy-core source.')
  .option('-a, --agents-only', 'Build only agent bundles.')
  .option('-t, --teams-only', 'Build only team bundles.')
  .option('--no-clean', 'Skip cleaning the dist/ directory before building.')
  .action(async (options) => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      if (options.clean) {
        console.log('Cleaning output directory...');
        await builder.cleanOutputDirs();
      }

      if (!options.teamsOnly) {
        console.log('Building agent bundles...');
        await builder.buildAgents();
      }
      if (!options.agentsOnly) {
        console.log('Building team bundles...');
        await builder.buildTeams();
      }

      console.log('\nBuild completed successfully!');
      console.log('Bundles are available in the dist/ directory.');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

program
  .command('build:web')
  .description('Build only the team bundles required for Web UIs (e.g., Gemini, Claude).')
  .action(async () => {
      const builder = new WebBuilder({ rootDir: process.cwd() });
      try {
          console.log('Cleaning output directory...');
          await builder.cleanOutputDirs();
          console.log('Building team bundles for Web UI...');
          await builder.buildTeams();
          console.log('\nWeb build completed successfully!');
          console.log('Team bundles are available in dist/teams/');
      } catch (error) {
          console.error('Web build failed:', error.message);
          process.exit(1);
      }
  });
  
program
  .command('list:agents')
  .description('List all available agents in the .stigmergy-core.')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const agents = await builder.resolver.listAgents();
    console.log('Available agents:');
    agents.forEach(agent => console.log(`  - ${agent}`));
  });

program
  .command('validate')
  .description('Validate agent and team configurations by attempting to build them.')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      console.log('Validating agents...');
      // A build attempts to resolve all dependencies, which is a good validation step.
      await builder.buildAgents();
      
      console.log('\nValidating teams...');
      await builder.buildTeams();
      
      console.log('\nAll configurations seem valid based on the build process!');
    } catch (error) {
      console.error('Validation failed during build process:', error.message);
      process.exit(1);
    }
  });

program.parse();
