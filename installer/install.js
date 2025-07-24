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

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    const coreDestDir = path.join(CWD, ".stigmergy-core");

    spinner.text = "Copying core files & .env.example...";
    await fs.copy(CORE_SOURCE_DIR, coreDestDir, { overwrite: true });

    // Non-destructive .env.example handling
    const envExampleSource = path.join(__dirname, "..", ".env.example");
    const envExampleDest = path.join(CWD, ".env.example");
    if (await fs.pathExists(envExampleDest)) {
      const stigmergyEnvContent = await fs.readFile(envExampleSource, "utf8");
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
        spinner.succeed("Copied core files & updated .env.example.");
      } else {
        spinner.succeed("Copied core files. .env.example already up to date.");
      }
    } else {
      await fs.copy(envExampleSource, envExampleDest);
      spinner.succeed("Copied core files & created .env.example.");
    }

    spinner.text = `Configuring IDE integration...`;
    await configureIde(coreDestDir);
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
        chalk.yellow("\nNeo4j indexing skipped. Configure Neo4j in your .env file to enable this.")
      );
    }

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red(error.message));
  }
}

async function configureIde(coreDestDir) {
  const modes = [];
  const PORT = process.env.PORT || 3000;
  const ENGINE_URL = `http://localhost:${PORT}`;

  const systemRoleDefinition = `You are the Stigmergy System agent. Your primary purpose is to receive the initial project goal from the user and start the autonomous engine. Use the user's prompt to make a POST request to the /api/system/start endpoint.`;

  modes.push({
    slug: "system",
    name: "🚀 Stigmergy System",
    roleDefinition: systemRoleDefinition,
    api: { url: `${ENGINE_URL}/api/system/start`, method: "POST" },
    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
  });

  const agentFiles = await fs.readdir(path.join(coreDestDir, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;
    try {
      const agentContent = await fs.readFile(path.join(coreDestDir, "agents", file), "utf8");
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
      console.warn(chalk.yellow(`\nWarning: Could not parse YAML in ${file}. Skipping.`));
    }
  }

  if (modes.length <= 1) {
    throw new Error("Critical Error: No valid agents found. IDE configuration failed.");
  }

  modes.sort((a, b) => a.name.localeCompare(b.name));

  let modesString = "[\n";
  modes.forEach((mode, index) => {
    const isLast = index === modes.length - 1;
    const safeRoleDef = mode.roleDefinition.replace(/\\/g, "\\\\").replace(/`/g, "\\`");
    modesString += "  {\n";
    modesString += `    slug: '${mode.slug}',\n`;
    modesString += `    name: '${mode.name.replace(/'/g, "\\'")}',\n`;
    modesString += `    roleDefinition: \`${safeRoleDef}\`,\n`;
    modesString += `    api: ${JSON.stringify(mode.api, null, 4).replace(/"/g, "'").replace(/\n/g, "\n    ")},\n`;
    modesString += `    groups: ${JSON.stringify(mode.groups)},\n`;
    modesString += `  }${isLast ? "" : ","}\n`;
  });
  modesString += "]";

  const fileContent = `customModes: ${modesString}`;
  await fs.writeFile(path.join(CWD, ".roomodes"), fileContent, "utf8");
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
