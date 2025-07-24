const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const { spawn } = require("child_process");

require("dotenv").config();

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const CORE_DEST_DIR = path.join(CWD, ".stigmergy-core");
const ROO_MODES_PATH = path.join(CWD, ".roomodes");

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy v1.2...").start();
  try {
    spinner.text = "Copying .stigmergy-core knowledge base...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    spinner.succeed("Copied .stigmergy-core knowledge base.");

    spinner.text = `Configuring IDE integration (.roomodes)...`;
    await configureIde();
    spinner.succeed(`IDE configuration created at .roomodes.`);

    // MODIFIED: Smartly check if indexing is possible before asking.
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "runIndexer",
          message:
            "A code graph improves agent understanding. Index the current project with Neo4j now?",
          default: true,
        },
      ]);
      if (answers.runIndexer) {
        spinner.start("Starting code graph indexing process...");
        await runIndexer();
        spinner.succeed("Code graph indexing process finished.");
      }
    } else {
      console.log(
        chalk.yellow(
          "\nNeo4j indexing skipped. Please configure NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD in your .env file to enable this feature."
        )
      );
    }

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Fill in your LLM and Neo4j details in the `.env` file if you haven't.");
    console.log("  2. Run `npm start` to start the engine.");
    console.log("  3. Open your IDE's chat and type `@system start a new project...`");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error));
  }
}

async function configureIde() {
  const newModes = [];
  const PORT = process.env.PORT || 3000;
  const ENGINE_URL = `http://localhost:${PORT}`;

  newModes.push({
    slug: "system",
    name: "🚀 Stigmergy System",
    api: { url: `${ENGINE_URL}/api/system/start`, method: "POST" },
    groups: ["stigmergy-system"],
  });

  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;

    try {
      const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, "agents", file), "utf8");

      // THE DEFINITIVE REGEX FIX:
      const yamlMatch = agentContent.match(/```(yaml|yml)\s*\r?\n([\s\S]*?)```/);

      if (!yamlMatch || !yamlMatch[2]) {
        // Check for capture group 2
        console.warn(
          chalk.yellow(`Warning: Skipping agent file with no valid YAML block: ${file}`)
        );
        continue;
      }

      // THE DEFINITIVE PARSING FIX: Use capture group 2, which is ONLY the content.
      const config = yaml.load(yamlMatch[2]);
      const agentConfig = config?.agent;

      if (!agentConfig?.alias || !agentConfig?.id) {
        console.warn(
          chalk.yellow(
            `Warning: Agent file ${file} is missing a required 'id' or 'alias'. Skipping.`
          )
        );
        continue;
      }

      newModes.push({
        slug: agentConfig.alias,
        name: `${agentConfig.icon || "🤖"} ${agentConfig.name}`,
        api: {
          url: `${ENGINE_URL}/api/interactive`,
          method: "POST",
          include: ["history", "context"],
          static_payload: { agentId: agentConfig.id },
        },
        groups: ["stigmergy-agent"],
      });
    } catch (e) {
      console.error(
        chalk.red(`\nError: Failed to parse YAML in agent file: ${file}. Skipping.`),
        e.message
      );
      continue;
    }
  }

  if (newModes.length <= 1) {
    throw new Error(
      "Critical Error: No valid agent configurations were found. The IDE configuration file could not be generated."
    );
  }

  newModes.sort((a, b) => a.name.localeCompare(b.name));

  const modesString = newModes
    .map(
      (mode) =>
        `  {\n    slug: "${mode.slug}",\n    name: "${mode.name}",\n    api: ${JSON.stringify(mode.api, null, 2).replace(/\n/g, "\n    ")},\n    groups: ${JSON.stringify(mode.groups)}\n  }`
    )
    .join(",\n");
  const fileContent = `// Stigmergy & Roo Code Configuration (v1.2)\nmodule.exports = {\n  customModes: [\n${modesString}\n  ]\n};`;

  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

async function runIndexer() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "indexer", "index.js");
    const indexerProcess = spawn("node", [scriptPath], { stdio: "inherit" });
    indexerProcess.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`Indexer process exited with code ${code}`))
    );
    indexerProcess.on("error", (err) => reject(err));
  });
}

module.exports = { run };
