const { Command } = require('commander');
const path = require('path');
const Installer = require('./lib/installer');

// Dynamic imports for ES modules
let chalk, inquirer;

async function initializeModules() {
  if (!chalk) {
    chalk = (await import('chalk')).default;
    inquirer = (await import('inquirer')).default;
  }
}

async function main() {
  await initializeModules();
  const program = new Command();

  program
    .name('bmad-method')
    .description('BMAD Method installer - AI-powered Agile development framework')
    .version(require('../../package.json').version);

  program
    .command('install')
    .description('Interactively install or update a BMAD-METHOD project.')
    .option('-d, --directory <path>', 'Target directory for installation', '.')
    .action(async (options) => {
      try {
        console.log(chalk.bold.cyan('Welcome to the BMAD-METHOD v4 Installer!'));
        console.log("Let's get your project set up for autonomous AI development.");

        const { installType } = await inquirer.prompt([
            {
                type: 'list',
                name: 'installType',
                message: 'Choose your installation type:',
                choices: [
                    { name: 'Complete Installation (Recommended): Install the full .bmad-core and IDE integrations.', value: 'full' },
                    { name: 'Team-based Installation: Install a specific team of agents and their tools.', value: 'team' },
                    { name: 'Expansion Pack Hub: Set up a minimal project to install expansion packs into.', value: 'expansion-only' },
                ]
            }
        ]);

        let team = null;
        if (installType === 'team') {
            const teams = await Installer.getAvailableTeams();
            const { selectedTeam } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'selectedTeam',
                    message: 'Which team would you like to install?',
                    choices: teams.map(t => ({ name: `${t.icon} ${t.name} - ${t.description}`, value: t.id }))
                }
            ]);
            team = selectedTeam;
        }

        const { ides } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'ides',
                message: 'Select IDEs to configure (Space to select, Enter to confirm):',
                choices: [
                    { name: 'Cursor', value: 'cursor' },
                    { name: 'VS Code (Roo Code extension)', value: 'roo' },
                    { name: 'Anthropic Claude Code', value: 'claude-code' },
                    { name: 'Windsurf', value: 'windsurf' },
                ]
            }
        ]);
        
        const { expansionPacks } = await inquirer.prompt([
            {
                type: 'checkbox',
                name: 'expansionPacks',
                message: 'Select any expansion packs to install:',
                choices: async () => {
                    const packs = await Installer.getAvailableExpansionPacks();
                    if (packs.length === 0) return [{ name: 'No expansion packs found.', disabled: true }];
                    return packs.map(p => ({ name: `${p.name} - ${p.description}`, value: p.id }));
                }
            }
        ]);

        const config = {
          directory: options.directory,
          installType,
          team,
          ides,
          expansionPacks,
          includeWebBundles: true, // Always include by default for new installs
          webBundlesDirectory: path.join(options.directory, 'dist')
        };
        
        await Installer.install(config);
      } catch (error) {
        console.error(chalk.red('\nAn error occurred during installation:'));
        console.error(error.message);
        process.exit(1);
      }
    });

  program.parse(process.argv);
}

main();
