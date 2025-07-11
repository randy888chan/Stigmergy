#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs/promises');
const path = require('path');
const yaml = require('js-yaml');
const WebBuilder = require('./builders/web-builder');

async function main() {
  const chalk = (await import('chalk')).default;
  const program = new Command();

  program
    .name('stigmergy-cli')
    .description('Pheromind: CLI for managing the Autonomous AI Development Workshop.')
    .version(require('../package.json').version);

  program
    .command('build')
    .description('Build web bundles for agents and teams from the .stigmergy-core source.')
    .option('-a, --agents-only', 'Build only agent bundles.')
    .option('-t, --teams-only', 'Build only team bundles.')
    .option('--agent <agentId>', 'Build a single agent bundle by its ID (e.g., mary, winston).')
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
    .command('validate:agents')
    .description('Validate the YAML frontmatter of all agent markdown files.')
    .action(async () => {
      console.log(chalk.bold('Validating agent configurations...'));
      const agentsDir = path.join(process.cwd(), '.stigmergy-core', 'agents');
      let files;
      try {
        files = await fs.readdir(agentsDir);
      } catch (error) {
        console.error(chalk.red(`Error reading agents directory: ${error.code === 'ENOENT' ? 'Directory not found.' : error.message}`));
        process.exit(1);
      }

      const agentFiles = files.filter((f) => f.endsWith('.md'));
      let errorCount = 0;

      for (const file of agentFiles) {
        const filePath = path.join(agentsDir, file);
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const yamlMatch = content.match(/```yaml\n([\s\S]*?)```/);
          if (!yamlMatch || !yamlMatch) {
            throw new Error('No valid YAML frontmatter block found.');
          }
          yaml.load(yamlMatch);
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

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("\nAn unexpected error occurred in the CLI:", err);
  process.exit(1);
});
