const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const ora = require("ora");

require("dotenv").config({ path: path.join(process.cwd(), ".env") });

const CORE_SOURCE_DIR = path.join(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();

/**
 * THE FINAL, CORRECTED PARSER.
 * This function extracts the first valid YAML block from the file.
 * It then constructs a roleDefinition from the 'persona' object within that YAML.
 * @param {string} content The raw file content.
 * @returns {{config: object, roleDefinition: string}|null}
 */
function parseAgentFile(content) {
  try {
    const yamlBlockRegex = /```(yaml|yml)\n([\s\S]*?)\n```/;
    const match = content.match(yamlBlockRegex);

    if (!match || !match[2]) {
      return null;
    }

    const config = yaml.load(match[2]);

    if (!config || !config.agent || !config.persona) {
      return null;
    }

    const persona = config.persona;
    const personaParts = [
      persona.identity,
      persona.role ? `Role: ${persona.role}` : null,
      persona.style ? `Style: ${persona.style}` : null,
    ].filter(Boolean); // This removes any null/undefined values

    const roleDefinition = personaParts.join("\n\n");

    if (!roleDefinition) {
      return null; // A mode requires a non-empty role definition
    }

    return { config, roleDefinition };
  } catch (e) {
    return null;
  }
}

async function run() {
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    spinner.text = "Copying core files...";
    const coreDestDir = path.join(CWD, ".stigmergy-core");
    await fs.copy(CORE_SOURCE_DIR, coreDestDir, { overwrite: true });
    spinner.succeed("Copied core files.");

    spinner.text = "Configuring environment file...";
    await handleEnvFile();
    spinner.succeed("Environment file configured.");

    spinner.text = `Configuring IDE integration...`;
    await configureIde(coreDestDir);
    spinner.succeed(`IDE configuration created at .roomodes.`);

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Ensure all required variables in '.env' are set.");
    console.log("  2. Run 'npm start' to launch the Stigmergy engine.");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.red.bold("Error:"), chalk.red(error.message));
  }
}

async function handleEnvFile() {
  const exampleEnvPath = path.join(__dirname, "..", ".env.example");
  const projectEnvPath = path.join(CWD, ".env");
  const projectSampleEnvPath = path.join(CWD, ".env.sample");

  const targetPath = (await fs.pathExists(projectSampleEnvPath))
    ? projectSampleEnvPath
    : projectEnvPath;
  const exampleEnvContent = await fs.readFile(exampleEnvPath, "utf8");
  const exampleVars = exampleEnvContent
    .split("\n")
    .filter((line) => line.trim() && !line.startsWith("#"));

  if (!(await fs.pathExists(targetPath))) {
    await fs.copy(exampleEnvPath, targetPath);
    console.log(
      chalk.yellow(
        `\nA new '${path.basename(targetPath)}' file was created. Please add your API keys.`
      )
    );
    return;
  }

  const projectEnvContent = await fs.readFile(targetPath, "utf8");
  const varsToAppend = exampleVars.filter(
    (line) => !projectEnvContent.includes(line.split("=")[0])
  );
  if (varsToAppend.length > 0) {
    const appendContent =
      "\n\n# --- Stigmergy variables appended by installer ---\n" + varsToAppend.join("\n");
    await fs.appendFile(targetPath, appendContent);
    console.log(
      chalk.green(
        `Appended required Stigmergy variables to your existing '${path.basename(targetPath)}' file.`
      )
    );
  }
}

async function configureIde(coreDestDir) {
  const modes = [];
  const PORT = process.env.PORT || 3000;
  if (!process.env.PORT) {
    console.log(chalk.yellow(`\nWarning: PORT not set in .env, defaulting to ${PORT}.`));
  }
  const ENGINE_URL = `http://localhost:${PORT}`;

  modes.push({
    slug: "system",
    name: "🚀 Stigmergy Control",
    roleDefinition:
      "You are the master control for the Stigmergy Engine. Use this mode to start new projects by providing a high-level goal.",
    api: {
      url: `${ENGINE_URL}/api/system/start`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: '{"goal": "{{prompt}}"}',
    },
    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
  });

  // Create a default for saul in case dispatcher.md is missing/malformed
  let saulRoleDef = "I am Saul, the AI System Orchestrator.";
  try {
    const dispatcherContent = await fs.readFile(
      path.join(coreDestDir, "agents", "dispatcher.md"),
      "utf8"
    );
    const dispatcherParsed = parseAgentFile(dispatcherContent);
    if (dispatcherParsed) {
      saulRoleDef = dispatcherParsed.roleDefinition;
    }
  } catch (e) {
    console.warn(
      chalk.yellow("Warning: Could not read dispatcher.md, using default persona for @saul.")
    );
  }

  modes.push({
    slug: "saul",
    name: "🧠 Saul (Orchestrator)",
    roleDefinition: saulRoleDef,
    api: {
      url: `${ENGINE_URL}/api/chat`,
      method: "POST",
      include: ["history"],
      static_payload: { agentId: "dispatcher" },
    },
    groups: [{ title: "Stigmergy", color: "#14b8a6" }],
  });

  const agentFiles = await fs.readdir(path.join(coreDestDir, "agents"));
  for (const file of agentFiles) {
    if (!file.endsWith(".md")) continue;

    try {
      const agentContent = await fs.readFile(path.join(coreDestDir, "agents", file), "utf8");
      const parsed = parseAgentFile(agentContent);

      if (!parsed) {
        console.warn(
          chalk.yellow(
            `Warning: Could not parse agent file ${file}. It may be malformed or missing a valid persona. Skipping.`
          )
        );
        continue;
      }

      const agentConfig = parsed.config?.agent;

      if (agentConfig && agentConfig.alias && agentConfig.id) {
        if (agentConfig.id === "dispatcher" || agentConfig.alias === "saul") continue;
        if (file === "sarah.md") continue;

        modes.push({
          slug: agentConfig.alias,
          name: `${agentConfig.icon || "🤖"} ${agentConfig.name}`,
          roleDefinition: parsed.roleDefinition,
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
      console.warn(chalk.yellow(`\nError processing ${file}. Skipping. Message: ${e.message}`));
    }
  }

  modes.sort((a, b) => a.name.localeCompare(b.name));

  const yamlOutput = yaml.dump({ customModes: modes });
  const fileContent = `# This file is auto-generated by 'stigmergy install'. Do not edit manually.\n\n${yamlOutput}`;

  await fs.writeFile(path.join(CWD, ".roomodes"), fileContent, "utf8");
}

module.exports = { run, parseAgentYaml: parseAgentFile }; // Export with a consistent name
