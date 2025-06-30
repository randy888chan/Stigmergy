#!/usr/bin/env node

const { Command } = require('commander');
const WebBuilder = require('./builders/web-builder');
const V3ToV4Upgrader = require('./upgraders/v3-to-v4-upgrader');
const IdeSetup = require('./installer/lib/ide-setup');
const path = require('path');

const program = new Command();

program
  .name('bmad-build')
  .description('BMAD-METHOD build tool for creating web bundles')
  .version('4.10.0');

program
  .command('build')
  .description('Build web bundles for agents and teams')
  .option('-a, --agents-only', 'Build only agent bundles')
  .option('-t, --teams-only', 'Build only team bundles')
  .option('-e, --expansions-only', 'Build only expansion pack bundles')
  .option('--no-expansions', 'Skip building expansion packs')
  .option('--no-clean', 'Skip cleaning output directories')
  .action(async (options) => {
    const builder = new WebBuilder({
      rootDir: process.cwd()
    });

    try {
      if (options.clean) {
        console.log('Cleaning output directories...');
        await builder.cleanOutputDirs();
      }

      if (options.expansionsOnly) {
        console.log('Building expansion pack bundles...');
        await builder.buildAllExpansionPacks({ clean: false });
      } else {
        if (!options.teamsOnly) {
          console.log('Building agent bundles...');
          await builder.buildAgents();
        }

        if (!options.agentsOnly) {
          console.log('Building team bundles...');
          await builder.buildTeams();
        }

        if (!options.noExpansions) {
          console.log('Building expansion pack bundles...');
          await builder.buildAllExpansionPacks({ clean: false });
        }
      }

      console.log('Build completed successfully!');
    } catch (error) {
      console.error('Build failed:', error.message);
      process.exit(1);
    }
  });

// [[LLM-ENHANCEMENT]] Added new command as requested by user for focused web builds.
program
  .command('build:web')
  .description('Build only the team bundles required for the Web UI.')
  .action(async () => {
      const builder = new WebBuilder({ rootDir: process.cwd() });
      try {
          console.log('Cleaning output directories...');
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
  .description('List all available agents')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const agents = await builder.resolver.listAgents();
    console.log('Available agents:');
    agents.forEach(agent => console.log(`  - ${agent}`));
  });

program
  .command('list:expansions')
  .description('List all available expansion packs')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const expansions = await builder.listExpansionPacks();
    console.log('Available expansion packs:');
    expansions.forEach(expansion => console.log(`  - ${expansion.id} (${expansion.name})`));
  });

program
  .command('validate')
  .description('Validate agent and team configurations')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      console.log('Validating agents...');
      await builder.buildAgents();
      
      console.log('\nValidating teams...');
      await builder.buildTeams();
      
      console.log('\nAll configurations seem valid based on build process!');
    } catch (error) {
      console.error('Validation failed during build process:', error.message);
      process.exit(1);
    }
  });

program
  .command('upgrade')
  .description('Upgrade a BMAD-METHOD V3 project to V4')
  .option('-p, --project <path>', 'Path to V3 project (defaults to current directory)')
  .option('--dry-run', 'Show what would be changed without making changes')
  .option('--no-backup', 'Skip creating backup (not recommended)')
  .action(async (options) => {
    const upgrader = new V3ToV4Upgrader();
    await upgrader.upgrade({
      projectPath: options.project,
      dryRun: options.dryRun,
      backup: options.backup
    });
  });

program.parse();