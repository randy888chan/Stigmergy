#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
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
  .option('--agent <agentId>', 'Build a single agent bundle by its ID.')
  .option('--no-clean', 'Skip cleaning the dist/ directory before building.')
  .action(async (options) => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      if (options.clean) {
        console.log('Cleaning output directory...');
        await builder.cleanOutputDirs();
      }

      if (options.agent) {
        await builder.buildAgents(options.agent);
      } else {
        if (!options.teamsOnly) {
          await builder.buildAgents();
        }
        if (!options.agentsOnly) {
          await builder.buildTeams();
        }
      }

      console.log(chalk.green('\nBuild completed successfully!'));
      console.log('Bundles are available in the dist/ directory.');
    } catch (error) {
      console.error(chalk.red('Build failed:'), error.message);
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
      console.log(chalk.green('\nWeb build completed successfully!'));
      console.log('Team bundles are available in dist/teams/');
    } catch (error) {
      console.error(chalk.red('Web build failed:'), error.message);
      process.exit(1);
    }
  });

program
  .command('list:agents')
  .description('List all available agents in the .stigmergy-core.')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    const agents = await builder.resolver.listAgents();
    console.log(chalk.bold('Available agents:'));
    agents.forEach((agent) => console.log(`  - ${agent}`));
  });

program
  .command('validate')
  .description('Validate agent and team configurations by attempting to build them.')
  .action(async () => {
    const builder = new WebBuilder({ rootDir: process.cwd() });
    try {
      console.log('Validating agents...');
      await builder.buildAgents();

      console.log('\nValidating teams...');
      await builder.buildTeams();

      console.log(chalk.green('\nAll configurations seem valid based on the build process!'));
    } catch (error) {
      console.error(chalk.red('Validation failed during build process:'), error.message);
      process.exit(1);
    }
  });

program
  .command('validate:agents')
  .description('Validate the YAML frontmatter of all agent markdown files.')
  .action(async () => {
    console.log(chalk.bold('Validating agent configurations...'));
    const agentsDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
    let files;
    try {
      files = await fs.readdir(agentsDir);
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.error(chalk.red(`Error: Directory not found at ${agentsDir}`));
        console.error(chalk.yellow('Please run this command from the root of a project with Stigmergy installed.'));
      } else {
        console.error(chalk.red(`Error reading agents directory: ${error.message}`));
      }
      process.exit(1);
    }

    const agentFiles = files.filter((f) => f.endsWith('.md'));
    let errorCount = 0;

    for (const file of agentFiles) {
      const filePath = path.join(agentsDir, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
        if (!yamlMatch || !yamlMatch[1]) {
          console.error(chalk.red(`✗ ${file} - FAILED: No YAML frontmatter block found.`));
          errorCount++;
          continue;
        }
        yaml.load(yamlMatch[1]);
        console.log(chalk.green(`✓ ${file} - OK`));
      } catch (error) {
        console.error(chalk.red(`✗ ${file} - FAILED:`));
        console.error(`  ${error.message.replace(/\n/g, '\n  ')}`);
        errorCount++;
      }
    }

    console.log('\n--------------------');
    if (errorCount === 0) {
      console.log(chalk.green.bold('Validation successful! All agent configurations are valid.'));
    } else {
      console.error(chalk.red.bold(`Validation failed. Found ${errorCount} invalid agent configuration(s).`));
      process.exit(1);
    }
  });

program.parse();
