const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const { spawn } = require("child_process");

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();
const CORE_DEST_DIR = path.join(CWD, ".stigmergy-core");
const ROO_MODES_PATH = path.join(CWD, ".roomodes");

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy v1.0...").start();
  try {
    spinner.text = "Copying .stigmergy-core knowledge base...";
    await fs.copy(CORE_SOURCE_DIR, CORE_DEST_DIR, { overwrite: true });
    spinner.succeed("Copied .stigmergy-core knowledge base.");

    spinner.text = "Performing brand alignment to 'Stigmergy'...";
    await alignBranding();
    spinner.succeed("Brand alignment complete.");

    spinner.text = `Configuring IDE integration (.roomodes)...`;
    await configureIde();
    spinner.succeed(`IDE configuration created at .roomodes.`);

    const answers = await inquirer.prompt([
      {
        type: "confirm",
        name: "runIndexer",
        message: "A code graph improves agent understanding. Index the current project with Neo4j now?",
        default: true,
      },
    ]);

    if (answers.runIndexer) {
      spinner.start("Starting code graph indexing process...");
      await runIndexer();
      spinner.succeed("Code graph indexing process finished.");
    }

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Fill in your LLM and Neo4j details in the `.env` file.");
    console.log("  2. Run `node cli/index.js start` to start the engine.");
    console.log("  3. Open your IDE's chat and type `@system start a new project...`");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error));
    console.error(chalk.yellow("Please ensure you have write permissions and that Neo4j is running if you chose to index."));
  }
}

async function configureIde() {
  const newModes = [];
  const ENGINE_URL = `http://localhost:3000`; // Hardcoded for simplicity and robustness

  // --- Create System Control Modes ---
  newModes.push({
      slug: "system",
      name: "🚀 Stigmergy System",
      api: { url: `${ENGINE_URL}/api/system/start`, method: "POST" },
      groups: ["stigmergy-system"],
  });
  newModes.push({
      slug: "system:approve",
      name: "✅ Stigmergy: Approve",
      api: { url: `${ENGINE_URL}/api/system/approve-execution`, method: "POST" },
      groups: ["stigmergy-system"],
  });

  const agentFiles = await fs.readdir(path.join(CORE_DEST_DIR, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;

    try {
        const agentContent = await fs.readFile(path.join(CORE_DEST_DIR, "agents", file), "utf8");
        const yamlMatch = agentContent.match(/```(yaml|yml)\n([\s\S]*?)```/i);
        if (!yamlMatch || !yamlMatch[2]) {
             console.warn(chalk.yellow(`Warning: Skipping agent file with no YAML block: ${file}`));
             continue;
        };

        const config = yaml.load(yamlMatch[2]);
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
    } catch(e) {
        console.error(chalk.red(`Error parsing agent ${file}. Skipping.`), e.message);
    }
  }

  const sortedNewModes = newModes.sort((a, b) => a.name.localeCompare(b.name));
  const modesString = JSON.stringify(sortedNewModes, null, 2).replace(/"slug"/g, 'slug').replace(/"name"/g, 'name').replace(/"api"/g, 'api').replace(/"groups"/g, 'groups');

  const fileContent = `// Stigmergy & Roo Code Configuration (v1.0)\nmodule.exports = {\n  customModes: ${modesString}\n};`;
  await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

async function runIndexer() {
  return new Promise((resolve, reject) => {
    const indexerProcess = spawn("node", [path.join(__dirname, "..", "indexer", "index.js")], {
      stdio: "inherit",
    });
    indexerProcess.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Indexer process exited with code ${code}`));
      }
    });
    indexerProcess.on("error", (err) => {
      reject(err);
    });
  });
}

async function alignBranding() {
    // This is a placeholder for a more robust branding alignment script.
    // In a real scenario, this would scan and replace "Pheromind", etc., with "Stigmergy".
    const readmePath = path.join(CWD, "README.md");
    if(await fs.pathExists(readmePath)) {
        let content = await fs.readFile(readmePath, 'utf8');
        content = content.replace(/Pheromind/g, 'Stigmergy');
        await fs.writeFile(readmePath, content, 'utf8');
    }
}


module.exports = { run };
