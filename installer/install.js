const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");

require("dotenv").config();

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const CORE_DEST_DIR = path.join(CWD, ".stigmergy-core");
const ROO_MODES_PATH = path.join(CWD, ".roomodes");

async function run() {
  const spinner = ora("🚀 Welcome to the Pheromind Framework Installer.").start();
  try {
    spinner.text = "Copying .stigmergy-core knowledge base...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    spinner.succeed("Copied .stigmergy-core knowledge base.");

    spinner.text = `Configuring IDE (${path.basename(ROO_MODES_PATH)})...`;
    await configureIde();
    spinner.succeed(`IDE configuration created at .roomodes.`);

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

  // Manually build the string to ensure unquoted keys
  let modesString = "[\n";
  sortedNewModes.forEach((mode, index) => {
    modesString += `    {\n`;
    modesString += `      slug: "${mode.slug}",\n`; // unquoted key
    modesString += `      name: "${mode.name}",\n`; // unquoted key
    modesString += `      api: ${JSON.stringify(mode.api, null, 4).replace(/\n/g, "\n      ")},\n`; // inner object is fine
    modesString += `      groups: ${JSON.stringify(mode.groups)}\n`; // unquoted key
    modesString += `    }${index < sortedNewModes.length - 1 ? "," : ""}\n`;
  });
  modesString += "  ]";

  const fileContent = `
// Pheromind & Roo Code Configuration
module.exports = {
  customModes: ${modesString}
};
  `.trim();

  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

module.exports = { run };
