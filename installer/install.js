const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const { spawn } = require("child_process");

require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const CORE_DEST_DIR = path.join(CWD, ".stigmergy-core");
const ROO_MODES_PATH = path.join(CWD, ".roomodes");
const ENV_EXAMPLE_DEST = path.join(CWD, ".env.example");
const ENV_EXAMPLE_SOURCE = path.join(__dirname, "..", ".env.example");

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    spinner.text = "Copying .stigmergy-core knowledge base...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    spinner.succeed("Copied .stigmergy-core.");

    spinner.text = "Configuring environment...";
    await configureEnvironment();
    spinner.succeed("Environment configured.");

    spinner.text = `Configuring IDE integration (.roomodes)...`;
    await configureIde();
    spinner.succeed(`IDE configuration created at .roomodes.`);

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
        chalk.yellow("\nNeo4j indexing skipped. Configure Neo4j in your .env file to enable this.")
      );
    }

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log(
      "  1. If you don't have a `.env` file, copy `.env.example` to `.env` and fill in your keys."
    );
    console.log("  2. Run `npm start` to start the engine.");
    console.log("  3. Open your IDE's chat and type `@system start a new project...`");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error.message));
  }
}

// --- NEW: NON-DESTRUCTIVE ENVIRONMENT CONFIGURATION ---
async function configureEnvironment() {
  const stigmergyEnvContent = await fs.readFile(ENV_EXAMPLE_SOURCE, "utf8");

  if (await fs.pathExists(ENV_EXAMPLE_DEST)) {
    // .env.example exists, so we'll append missing variables.
    let existingContent = await fs.readFile(ENV_EXAMPLE_DEST, "utf8");

    const missingVars = [];
    const stigmergyVars = stigmergyEnvContent.split("\n");

    for (const svar of stigmergyVars) {
      if (svar.trim() === "" || svar.trim().startsWith("#")) continue;
      const key = svar.split("=")[0];
      if (!existingContent.includes(key)) {
        missingVars.push(svar);
      }
    }

    if (missingVars.length > 0) {
      const appendix = [
        "\n",
        "# ------------------------------------ #",
        "# Stigmergy Configuration (added by installer)",
        "# ------------------------------------ #",
        ...missingVars,
      ].join("\n");

      await fs.appendFile(ENV_EXAMPLE_DEST, appendix);
      console.log(chalk.green("Appended Stigmergy variables to existing .env.example."));
    } else {
      console.log(
        chalk.gray(
          "Existing .env.example already contains all Stigmergy variables. No changes needed."
        )
      );
    }
  } else {
    // No .env.example exists, so we can safely copy ours.
    await fs.copy(ENV_EXAMPLE_SOURCE, ENV_EXAMPLE_DEST);
    console.log(chalk.green("Created a new .env.example with Stigmergy configuration."));
  }
}

// configureIde function remains the same as the last correct version
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
      const startFence = "```yaml";
      const altStartFence = "```yml";
      const endFence = "```";
      let startIndex = agentContent.indexOf(startFence);
      if (startIndex === -1) startIndex = agentContent.indexOf(altStartFence);
      if (startIndex === -1) continue;
      const contentStartIndex = startIndex + startFence.length;
      const endIndex = agentContent.indexOf(endFence, contentStartIndex);
      if (endIndex === -1) continue;
      const yamlString = agentContent.substring(contentStartIndex, endIndex).trim();
      if (!yamlString) continue;
      const config = yaml.load(yamlString);
      const agentConfig = config?.agent;
      if (!agentConfig?.alias || !agentConfig?.id) continue;
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
      console.error(chalk.red(`\nError parsing YAML in ${file}. Skipping.`), e.message);
      continue;
    }
  }

  if (newModes.length <= 1)
    throw new Error(
      "Critical Error: No valid agent configurations found. IDE file generation failed."
    );
  newModes.sort((a, b) => a.name.localeCompare(b.name));

  let modesString = "[\n";
  newModes.forEach((mode, index) => {
    const apiString = JSON.stringify(mode.api, null, 4).replace(/\n/g, "\n      ");
    const groupsString = JSON.stringify(mode.groups);
    modesString += `    {\n      slug: "${mode.slug}",\n      name: "${mode.name}",\n      api: ${apiString},\n      groups: ${groupsString}\n    }${index < newModes.length - 1 ? "," : ""}\n`;
  });
  modesString += "  ]";

  const fileContent = `// Stigmergy & Roo Code Configuration\nmodule.exports = {\n  customModes: ${modesString}\n};`;
  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

async function runIndexer() {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "..", "indexer", "index.js");
    const indexerProcess = spawn("node", [scriptPath], { stdio: "inherit" });
    indexerProcess.on("close", (code) => (code === 0 ? resolve() : reject()));
    indexerProcess.on("error", (err) => reject(err));
  });
}

module.exports = { run };
