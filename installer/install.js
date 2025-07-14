const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
const inquirer = require('inquirer');

const CORE_SOURCE_DIR = path.join(__dirname, '..', '.stigmergy-core');
const CORE_DEST_DIR = path.join(process.cwd(), '.stigmergy-core');
const ROOMODES_PATH = path.join(process.cwd(), '.roomodes');
const USER_PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');
const ENGINE_URL = 'http://localhost:3000'; // Centralize engine URL

async function run() {
  console.log(chalk.cyan('🚀 Welcome to the Pheromind Framework Installer.'));

  // 1. Copy .stigmergy-core
  if (await fs.pathExists(CORE_DEST_DIR)) {
    const { overwrite } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'overwrite',
        message: `The '${chalk.yellow('.stigmergy-core')}' directory already exists. Overwrite it?`,
        default: false,
      },
    ]);
    if (!overwrite) {
      console.log(chalk.red('Installation cancelled.'));
      return;
    }
  }
  await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
  console.log(chalk.green('✓ Copied .stigmergy-core knowledge base.'));

  // 2. Configure Roo Code (.roomodes)
  await configureRooCode();

  // 3. Add scripts to user's package.json
  if (await fs.pathExists(USER_PACKAGE_JSON_PATH)) {
    await addScriptsToPackageJson();
  } else {
    console.warn(
      chalk.yellow('! package.json not found. Skipping script injection. You can add them manually.')
    );
  }

  console.log(chalk.bold.green('\n✅ Installation complete!'));
  console.log(chalk.cyan('1. Create or update your .env file with your API keys.'));
  console.log(chalk.cyan('2. Run "npm run stigmergy:start" to start the engine.'));
}

async function configureRooCode() {
  let existingModes = { customModes: [] };
  if (await fs.pathExists(ROOMODES_PATH)) {
    try {
      const existingContent = await fs.readFile(ROOMODES_PATH, 'utf8');
      const loadedYaml = yaml.load(existingContent);
      if (loadedYaml && Array.isArray(loadedYaml.customModes)) {
        existingModes = loadedYaml;
      }
    } catch (e) {
      console.warn(chalk.yellow('Could not parse existing .roomodes, it will be overwritten.'));
    }
  }

  // Remove all old Pheromind modes to ensure a clean slate
  existingModes.customModes = existingModes.customModes.filter(m => !m.groups?.includes('pheromind'));

  // Add agent modes
  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, 'agents'));
  for (const file of agentFiles) {
    if (file.endsWith('.md')) {
      const agentId = path.basename(file, '.md');
      const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, 'agents', file), 'utf8');
      const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
      if (!yamlMatch) continue;

      const config = yaml.load(yamlMatch[1]);
      if (!config?.agent?.alias) continue;

      // Do not create modes for internal agents like the dispatcher
      if (config.agent.archetype === 'Dispatcher') continue;

      const newMode = {
        slug: config.agent.alias,
        name: `${config.agent.icon || '🤖'} ${config.agent.name}`,
        api: {
          url: `${ENGINE_URL}/api/interactive`,
          method: 'POST',
          include: ['history'],
          static_payload: { agentId },
        },
        groups: ['pheromind', 'read', 'edit', 'mcp'],
      };
      existingModes.customModes.push(newMode);
    }
  }

  // Add system control modes
  const controlModes = [
      { slug: 'system-pause', name: '⏸️ System Pause', url: `${ENGINE_URL}/api/signal/pause` },
      { slug: 'system-resume', name: '▶️ System Resume', url: `${ENGINE_URL}/api/signal/resume` },
      { slug: 'system-cancel', name: '⏹️ System Cancel', url: `${ENGINE_URL}/api/signal/cancel` },
  ];

  for (const mode of controlModes) {
      existingModes.customModes.push({
          slug: mode.slug,
          name: mode.name,
          api: { url: mode.url, method: 'POST' },
          groups: ['pheromind-control'],
      });
  }


  await fs.writeFile(ROOMODES_PATH, yaml.dump(existingModes, { sortKeys: true }));
  console.log(chalk.green('✓ Configured Roo Code with agent and system control modes.'));
}

async function addScriptsToPackageJson() {
  const packageJson = await fs.readJson(USER_PACKAGE_JSON_PATH);
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }

  const scriptsToAdd = {
    'stigmergy:start': 'stigmergy start',
    'stigmergy:build': 'stigmergy build --all',
  };

  let updated = false;
  for (const [name, command] of Object.entries(scriptsToAdd)) {
    if (packageJson.scripts[name] !== command) {
      packageJson.scripts[name] = command;
      updated = true;
    }
  }

  if (updated) {
    await fs.writeJson(USER_PACKAGE_JSON_PATH, packageJson, { spaces: 2 });
    console.log(chalk.green('✓ Added/Updated stigmergy scripts in your package.json.'));
  } else {
    console.log(chalk.dim('Scripts already exist in package.json, skipping.'));
  }
}

module.exports = { run };
