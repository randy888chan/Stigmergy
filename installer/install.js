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
const ENV_EXAMPLE_SOURCE = path.join(__dirname, "..", ".env.example");

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    spinner.text = "Copying core files...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });

    // Non-destructive .env.example handling
    const stigmergyEnvContent = await fs.readFile(ENV_EXAMPLE_SOURCE, "utf8");
    const envExampleDest = path.join(CWD, ".env.example");
    if (await fs.pathExists(envExampleDest)) {
      let existingContent = await fs.readFile(envExampleDest, "utf8");
      const stigmergyVars = stigmergyEnvContent
        .split("\n")
        .filter((line) => line.trim() && !line.trim().startsWith("#"));
      const missingVars = stigmergyVars.filter(
        (svar) => !existingContent.includes(svar.split("=")[0])
      );
      if (missingVars.length > 0) {
        await fs.appendFile(
          envExampleDest,
          ["\n# Stigmergy Configuration", ...missingVars].join("\n")
        );
      }
    } else {
      await fs.copy(ENV_EXAMPLE_SOURCE, envExampleDest);
    }
    spinner.succeed("Copied core files & configured environment.");

    spinner.text = `Configuring IDE integration...`;
    await configureIde();
    spinner.succeed(`IDE configuration created at .roomodes.`);

    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      const answers = await inquirer.prompt([
        {
          type: "confirm",
          name: "runIndexer",
          message: "Index project with Neo4j?",
          default: true,
        },
      ]);
      if (answers.runIndexer) {
        spinner.start("Starting code graph indexing...");
        await runIndexer();
        spinner.succeed("Code graph indexing finished.");
      }
    } else {
      console.log(
        chalk.yellow(
          "\nNeo4j indexing skipped. Configure Neo4j in your .env file to enable this feature."
        )
      );
    }

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Copy `.env.example` to `.env` and fill in your keys.");
    console.log("  2. Run `npm start` to start the engine.");
    console.log("  3. Your Stigmergy agents are now available in your IDE's chat.");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error.message));
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

      const yamlMatch = agentContent.match(/```(yaml|yml)([\s\S]*?)```/);
      if (!yamlMatch || !yamlMatch[2]) {
        continue;
      }

      const yamlString = yamlMatch[2];
      const config = yaml.load(yamlString);
      const agentConfig = config?.agent;

      if (agentConfig && agentConfig.alias && agentConfig.id) {
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
      }
    } catch (e) {
      console.warn(chalk.yellow(`\nWarning: Could not parse YAML in ${file}. Skipping.`));
      continue;
    }
  }

  if (newModes.length <= 1) {
    throw new Error(
      "Critical Error: No valid agent configurations found. IDE file generation failed."
    );
  }

  newModes.sort((a, b) => a.name.localeCompare(b.name));

  // --- THE DEFINITIVE ROO CODE FORMATTING FIX ---
  let modesString = "[\n";
  newModes.forEach((mode, index) => {
    // Correctly escape single quotes within the name
    const safeName = mode.name.replace(/'/g, "\\'");
    // Use single quotes for all strings as per Roo Code's apparent preference
    const apiString = JSON.stringify(mode.api, null, 4)
      .replace(/"([^"]+)":/g, "$1:") // Unquote keys
      .replace(/"/g, "'") // Use single quotes for values
      .replace(/\n/g, "\n      ");

    const groupsString = JSON.stringify(mode.groups).replace(/"/g, "'");

    modesString += `    {\n`;
    modesString += `      slug: '${mode.slug}',\n`;
    modesString += `      name: '${safeName}',\n`;
    modesString += `      api: ${apiString},\n`;
    modesString += `      groups: ${groupsString}\n`;
    modesString += `    }${index < newModes.length - 1 ? "," : ""}\n`;
  });
  modesString += "  ]";

  // This generates the file starting DIRECTLY with `customModes: [...]`
  const fileContent = `customModes: ${modesString}`;
  // --- END OF FIX ---

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
