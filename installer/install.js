const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');

const CORE_SOURCE_DIR = path.join(__dirname, '..', '.stigmergy-core');
const CORE_DEST_DIR = path.join(process.cwd(), '.stigmergy-core');
const CONFIG_PATH = path.join(process.cwd(), 'pheromind.config.js');
const USER_PACKAGE_JSON_PATH = path.join(process.cwd(), 'package.json');

async function run() {
  console.log(chalk.cyan('🚀 Welcome to the Pheromind Framework Installer.'));

  // 1. Copy .stigmergy-core knowledge base
  await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
  console.log(chalk.green('✓ Copied .stigmergy-core knowledge base.'));

  // 2. Generate the declarative config file
  await generatePheromindConfig();

  // 3. Advise on package.json scripts
  await adviseOnPackageJson();

  console.log(chalk.bold.green('\n✅ Installation complete!'));
  console.log(chalk.cyan(`\n1. A configuration file has been created at ${chalk.yellow('pheromind.config.js')}.`));
  console.log(chalk.cyan(`   Copy its contents into your IDE's configuration (e.g., .roomodes).`));
  console.log(chalk.cyan(`2. Ensure the recommended scripts are in your package.json.`));
  console.log(chalk.cyan(`3. Create or update your .env file with your API keys.`));
  console.log(chalk.cyan(`4. Run "npm run stigmergy:start" to start the engine.`));
}

async function generatePheromindConfig() {
  const customModes = [];
  const ENGINE_URL = 'http://localhost:3000';

  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, 'agents'));
  for (const file of agentFiles) {
    if (file.endsWith('.md')) {
      const agentId = path.basename(file, '.md');
      const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, 'agents', file), 'utf8');
      const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
      if (!yamlMatch) continue;

      const config = yaml.load(yamlMatch);
      if (!config?.agent?.alias) continue;

      customModes.push({
        slug: config.agent.alias,
        name: `${config.agent.icon || '🤖'} ${config.agent.name}`,
        api: {
          url: `${ENGINE_URL}/api/interactive`,
          method: 'POST',
          include: ['history'],
          static_payload: { agentId },
        },
        groups: ['pheromind-agent'],
      });
    }
  }

  const configObject = {
    // This structure is compatible with .roomodes
    customModes: customModes.sort((a,b) => a.name.localeCompare(b.name)),
  };

  const fileContent = `// Pheromind Configuration for IDE Integration
// Copy the 'customModes' array into your IDE's configuration file (e.g., .roomodes).
module.exports = ${JSON.stringify(configObject, null, 2)};
`;

  await fs.writeFile(CONFIG_PATH, fileContent, 'utf8');
  console.log(chalk.green('✓ Generated declarative IDE config at pheromind.config.js.'));
}

async function adviseOnPackageJson() {
    console.log(chalk.yellow('\n--- Recommended package.json scripts ---'));
    console.log('Please ensure these scripts exist in your package.json "scripts" section:');
    console.log(chalk.green(`
  "stigmergy:start": "stigmergy start",
  "stigmergy:build": "stigmergy build --all",
  "test": "jest"
    `));
}

module.exports = { run };
