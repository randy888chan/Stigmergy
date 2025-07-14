const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
const inquirer = require('inquirer');

// When this script is run via `npx`, `__dirname` is inside the package's directory
// in node_modules, which is exactly what we want.
const CORE_SOURCE_DIR = path.join(__dirname, '..', '.stigmergy-core');
const CORE_DEST_DIR = path.join(process.cwd(), '.stigmergy-core');
const ROOMODES_PATH = path.join(process.cwd(), '.roomodes');
const USER_PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');

async function run() {
  console.log(chalk.cyan('🚀 Welcome to the Stigmergy Framework Installer.'));

  // 1. Copy .stigmergy-core
  if (await fs.pathExists(CORE_DEST_DIR)) {
      const { overwrite } = await inquirer.prompt([{
          type: 'confirm',
          name: 'overwrite',
          message: `The '${chalk.yellow('.stigmergy-core')}' directory already exists. Overwrite it?`,
          default: false
      }]);
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
    console.warn(chalk.yellow('! package.json not found. Skipping script injection. You can add them manually.'));
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

  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, 'agents'));
  for (const file of agentFiles) {
    if (file.endsWith('.md')) {
      const agentId = path.basename(file, '.md');
      const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, 'agents', file), 'utf8');
      const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
      if (!yamlMatch) continue;
      const config = yaml.load(yamlMatch[1]);
      if (!config?.agent?.alias) continue;

      const newMode = {
        slug: config.agent.alias,
        name: `${config.agent.icon || '🤖'} ${config.agent.name}`,
        api: { url: 'http://localhost:3000/api/execute', method: 'POST', include: ['history'], static_payload: { agentId } },
        groups: ['read', 'edit', 'mcp']
      };
      existingModes.customModes = existingModes.customModes.filter(m => m.slug !== newMode.slug);
      existingModes.customModes.push(newMode);
    }
  }
  await fs.writeFile(ROOMODES_PATH, yaml.dump(existingModes));
  console.log(chalk.green('✓ Configured Roo Code to communicate with the local engine.'));
}

async function addScriptsToPackageJson() {
    const packageJson = await fs.readJson(USER_PACKAGE_JSON_PATH);
    if (!packageJson.scripts) {
        packageJson.scripts = {};
    }
    
    const scriptsToAdd = {
        "stigmergy:start": "stigmergy start-engine",
        "stigmergy:index": "stigmergy index-code"
    };

    let updated = false;
    for (const [name, command] of Object.entries(scriptsToAdd)) {
        if (!packageJson.scripts[name]) {
            packageJson.scripts[name] = command;
            updated = true;
        }
    }

    if (updated) {
        await fs.writeJson(USER_PACKAGE_JSON_PATH, packageJson, { spaces: 2 });
        console.log(chalk.green('✓ Added "stigmergy:start" and "stigmergy:index" scripts to your package.json.'));
    } else {
        console.log(chalk.dim('Scripts already exist in package.json, skipping.'));
    }
}

module.exports = { run };
