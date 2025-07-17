const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");

require("dotenv").config();

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const CORE_DEST_DIR = path.join(CWD, ".stigmergy-core");
const ROO_MODES_PATH = path.join(CWD, ".roomodes.js"); // Using .js extension for clarity

// Safely require a module, returning a default if it fails or is invalid
function safeRequire(filePath) {
  try {
    // Bust the require cache to get the latest version on each run
    delete require.cache[require.resolve(filePath)];
    return require(filePath);
  } catch (e) {
    console.warn(
      chalk.yellow(`Could not parse existing .roomodes.js file. A new one will be created.`)
    );
    return {}; // Return an empty object if file doesn't exist or is invalid
  }
}

async function run() {
  const spinner = ora("🚀 Welcome to the Pheromind Framework Installer.").start();
  try {
    spinner.text = "Copying .stigmergy-core knowledge base...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    spinner.succeed("Copied .stigmergy-core knowledge base.");

    spinner.text = `Configuring IDE (${path.basename(ROO_MODES_PATH)})...`;
    await configureIde();
    spinner.succeed(`IDE configuration updated.`);

    console.log(chalk.bold.green("\n✅ Installation complete!"));
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error));
  }
}

async function configureIde() {
  const newModes = [];
  const ENGINE_URL = `http://localhost:${process.env.PORT || 3000}`;

  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;
    const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, "agents", file), "utf8");
    const yamlMatch = agentContent.match(/```(yaml|yml)\n([\s\S]*?)```/i);
    if (!yamlMatch || !yamlMatch[2]) continue;

    const config = yaml.load(yamlMatch[2]);
    const agentConfig = config?.agent;
    if (!agentConfig?.alias) continue;

    newModes.push({
      slug: agentConfig.alias,
      name: `${agentConfig.icon || "🤖"} ${agentConfig.name}`,
      api: {
        url: `${ENGINE_URL}/api/interactive`,
        method: "POST",
        include: ["history", "context"],
        static_payload: { agentId: agentConfig.id },
      },
      groups: ["pheromind-agent"],
    });
  }

  const sortedNewModes = newModes.sort((a, b) => a.name.localeCompare(b.name));

  // Read existing config safely
  const existingConfig = (await fs.pathExists(ROO_MODES_PATH)) ? safeRequire(ROO_MODES_PATH) : {};
  const existingModes = existingConfig.customModes || [];

  // Filter out any old Pheromind modes to ensure a clean update
  const otherUserModes = existingModes.filter((mode) => !mode.groups?.includes("pheromind-agent"));

  // Combine the user's other modes with our new, updated modes
  const finalModes = [...otherUserModes, ...sortedNewModes];

  // Create the final configuration object, preserving other exports
  const finalConfigObject = {
    ...existingConfig,
    customModes: finalModes,
  };

  // Convert the JavaScript object to a formatted string
  // This is more robust than simple JSON.stringify
  const fileContent = `// Pheromind & Roo Code Configuration
// This file is managed by the Pheromind installer.
// User-defined modes will be preserved.

module.exports = ${JSON.stringify(finalConfigObject, null, 2)};
`;

  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

module.exports = { run };
