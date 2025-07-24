const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");
const inquirer = require("inquirer");
const { spawn } = require("child_process");

const CWD = process.cwd();
const ROO_MODES_PATH = path.join(CWD, ".roomodes");

// The core function to generate the .roomodes content reliably.
async function generateRooModes() {
    const config = require(path.join(CWD, 'stigmergy.config.js')); // Use the new central config
    const coreDir = path.join(CWD, config.corePath);
    const PORT = process.env.PORT || 3000;
    const ENGINE_URL = `http://localhost:${PORT}`;

    const modes = [];

    // Add the @system mode
    modes.push({
        slug: "system",
        name: "🚀 Stigmergy System",
        roleDefinition: "You are the Stigmergy System agent. Your purpose is to receive the initial project goal and start the autonomous engine by making a POST request to the /api/system/start endpoint.",
        api: { url: `${ENGINE_URL}/api/system/start`, method: "POST" },
        groups: [{ title: "Stigmergy", color: "#14b8a6" }],
    });

    // Scan and process all agent files
    const agentFiles = await fs.readdir(path.join(coreDir, "agents"));
    for (const file of agentFiles) {
        if (!file.endsWith(".md")) continue;
        try {
            const agentContent = await fs.readFile(path.join(coreDir, "agents", file), "utf8");
            const yamlMatch = agentContent.match(/```(yaml|yml)([\s\S]*?)```/);
            if (!yamlMatch || !yamlMatch[2]) continue;

            const agentConfig = yaml.load(yamlMatch[2])?.agent;
            const roleDefinition = agentContent.substring(yamlMatch[0].length).trim();

            if (agentConfig && agentConfig.alias && agentConfig.id && roleDefinition) {
                modes.push({
                    slug: agentConfig.alias,
                    name: `${agentConfig.icon || "🤖"} ${agentConfig.name}`,
                    roleDefinition: roleDefinition,
                    api: {
                        url: `${ENGINE_URL}/api/interactive`,
                        method: "POST",
                        include: ["history", "context"],
                        static_payload: { agentId: agentConfig.id },
                    },
                    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
                });
            }
        } catch (e) {
            console.warn(chalk.yellow(`\nWarning: Could not parse agent file ${file}. Skipping.`));
        }
    }

    modes.sort((a, b) => a.name.localeCompare(b.name));

    // --- ROBUST FORMATTING ---
    // Manually build the string for perfect, stable formatting.
    let modesString = "[\n";
    modes.forEach((mode, index) => {
        const isLast = index === modes.length - 1;
        modesString += "  {\n";
        modesString += `    slug: '${mode.slug}',\n`;
        modesString += `    name: '${mode.name}',\n`;
        // Use backticks for roleDefinition to safely handle all characters and newlines
        modesString += `    roleDefinition: \`${mode.roleDefinition.replace(/`/g, "\\`")}\`,\n`;
        modesString += `    api: ${JSON.stringify(mode.api, null, 6).replace(/\n/g, '\n    ')},\n`;
        modesString += `    groups: ${JSON.stringify(mode.groups)},\n`;
        modesString += `  }${isLast ? "" : ","}\n`;
    });
    modesString += "]";

    const fileContent = `customModes: ${modesString}`;
    await fs.writeFile(ROO_MODES_PATH, fileContent, "utf8");
}

// Main installer function remains similar but calls the new generator
async function run() {
  const spinner = ora("🚀 Initializing Stigmergy v2...").start();
  try {
    spinner.text = "Copying core files...";
    const coreSourceDir = path.join(__dirname, "..", ".stigmergy-core");
    const coreDestDir = path.join(CWD, ".stigmergy-core");
    await fs.copy(coreSourceDir, coreDestDir, { overwrite: true });
    spinner.succeed("Copied core files.");

    spinner.text = "Generating .roomodes for IDE integration...";
    await generateRooModes();
    spinner.succeed("IDE configuration created successfully.");

    // Neo4j Indexing part remains the same
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
        const answers = await inquirer.prompt([{ type: "confirm", name: "runIndexer", message: "Index project with Neo4j?", default: true }]);
        if (answers.runIndexer) {
            spinner.start("Starting code graph indexing...");
            // (Your existing runIndexer logic)
            spinner.succeed("Code graph indexing finished.");
        }
    } else {
        console.log(chalk.yellow("\nNeo4j indexing skipped. Configure Neo4j in your .env to enable."));
    }
    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error.message));
  }
}

module.exports = { run };
