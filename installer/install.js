const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");

// .env is now loaded by the engine, but we check for it here for the port.
require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const ROO_MODES_PATH = path.join(CWD, ".roomodes");
const ENV_EXAMPLE_SOURCE = path.join(__dirname, "..", ".env.example");

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    const coreDestDir = path.join(CWD, ".stigmergy-core");
    spinner.text = "Copying core files & .env.example...";
    await fs.copy(CORE_SOURCE_DIR, coreDestDir, { overwrite: true });

    // Copy .env.example if a .env file doesn't already exist
    const envDest = path.join(CWD, ".env");
    if (!(await fs.pathExists(envDest))) {
      await fs.copy(ENV_EXAMPLE_SOURCE, path.join(CWD, ".env.example"), { overwrite: false });
      console.log(chalk.yellow("\nAn '.env.example' file was created. Please rename it to '.env' and add your API keys."));
    }
    spinner.succeed("Copied core files & handled environment.");

    spinner.text = `Configuring IDE integration...`;
    await configureIde(coreDestDir);
    spinner.succeed(`IDE configuration created at .roomodes.`);

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Configure your API keys in the '.env' file.");
    console.log("  2. Run 'npm start' to launch the Stigmergy engine.");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red.bold("Error:"), chalk.red(error.message));
    console.error(chalk.red("This is often due to file permission errors. Please check that you can write to the current directory."));
  }
}

async function configureIde(coreDestDir) {
  const modes = [];
  const PORT = process.env.PORT || 3000;
  if (!process.env.PORT) {
      console.log(chalk.yellow(`\nWarning: PORT not set in .env, defaulting to ${PORT}. The engine will run here.`));
  }
  const ENGINE_URL = `http://localhost:${PORT}`;

  // Master System Control Mode
  modes.push({
    slug: 'system',
    name: '🚀 Stigmergy Control',
    roleDefinition: 'You are the master control for the Stigmergy Engine. Use this mode to start new projects by providing a high-level goal.',
    api: {
        url: `${ENGINE_URL}/api/system/start`,
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: '{"goal": "{{prompt}}"}',
    },
    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
  });
  
  // Primary Orchestrator/Interaction Mode
  modes.push({
    slug: 'saul',
    name: '🧠 Saul (Orchestrator)',
    roleDefinition: 'You are Saul, the AI System Orchestrator. The system is currently running. Use this mode to check status, give approvals, or provide requested input.',
    api: {
        url: `${ENGINE_URL}/api/chat`,
        method: 'POST',
        include: ['history'],
        static_payload: { agentId: 'dispatcher' }
    },
    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
  });

  const agentFiles = await fs.readdir(path.join(coreDestDir, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;
    try {
      const agentContent = await fs.readFile(path.join(coreDestDir, "agents", file), "utf8");

      // --- START: THE DEFINITIVE PARSING FIX ---
      const yamlBlockRegex = /```(yaml|yml)\n([\s\S]*?)\n```/;
      const yamlMatch = agentContent.match(yamlBlockRegex);
      if (!yamlMatch || !yamlMatch[2]) {
        console.warn(chalk.yellow(`Warning: Could not find a valid YAML block in ${file}. Skipping.`));
        continue;
      }
      const yamlString = yamlMatch[2];
      const roleDefinition = agentContent.substring(agentContent.indexOf(yamlMatch[0]) + yamlMatch[0].length).trim();
      const config = yaml.load(yamlString);
      // --- END: THE DEFINITIVE PARSING FIX ---

      const agentConfig = config?.agent;
      if (agentConfig && agentConfig.alias && agentConfig.id) {
        if (agentConfig.id === 'dispatcher') continue; // Skip dispatcher as we have a dedicated 'saul' mode.
        modes.push({
          slug: agentConfig.alias,
          name: `${agentConfig.icon || "🤖"} ${agentConfig.name}`,
          roleDefinition: roleDefinition,
          api: {
            url: `${ENGINE_URL}/api/chat`,
            method: "POST",
            include: ["history"],
            static_payload: { agentId: agentConfig.id },
          },
          groups: [{ title: "Stigmergy", color: "#14b8a6" }],
        });
      }
    } catch (e) {
      console.warn(chalk.yellow(`\nWarning: Could not parse ${file}. It may be malformed. Skipping. Error: ${e.message}`));
    }
  }

  if (modes.length <= 1) { // We always have at least the system mode
    throw new Error("Critical Error: No valid agents were parsed. Ensure agent files in '.stigmergy-core/agents/' have a valid, closed ```yaml block followed by a persona.");
  }

  modes.sort((a, b) => a.name.localeCompare(b.name));

  const fileContent = `// This file is auto-generated by 'stigmergy install'. Do not edit manually.\ncustomModes: ${JSON.stringify(modes, null, 2)}`;
  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

module.exports = { run };
