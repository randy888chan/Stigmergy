import { runPreChecks } from "./precheck.js";
import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import chalk from "chalk";
import ora from "ora";
import "dotenv/config.js";
import { fileURLToPath } from "url";
import inquirer from "inquirer";
import figlet from "figlet";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORE_SOURCE_DIR = path.resolve(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();

function showNeo4jDiagram() {
  console.log(figlet.textSync("Neo4j Setup"));
  console.log(`
  1. Download Neo4j Desktop: https://neo4j.com/download/
  2. Install → Open → Click "New Graph"
  3. Set name: "Stigmergy"
  4. Set password: "stigmergy123" (or your choice)
  5. Click "Start"
  `);
}

async function createAuraDBInstance() {
  // This is a placeholder for the actual AuraDB API integration.
  // In a real implementation, this function would make API calls to create a new AuraDB instance.
  // For now, it returns mock data.
  console.log(
    chalk.yellow(
      "NOTE: This is a simulation. In a real-world scenario, this would create a live AuraDB instance."
    )
  );
  return {
    uri: "neo4j+s://xxxx.databases.neo4j.io",
    user: "neo4j",
    password: "mock_generated_password",
  };
}

async function configureNeo4j() {
  const choices = [
    { name: "Use free Neo4j AuraDB Cloud (Recommended)", value: "cloud" },
    { name: "Use local Neo4j Desktop", value: "local" },
  ];

  const { dbType } = await inquirer.prompt({
    type: "list",
    name: "dbType",
    message: "Choose Neo4j setup:",
    choices,
  });

  if (dbType === "cloud") {
    console.log("\nCreating free Neo4j cloud instance...");
    const auraDetails = await createAuraDBInstance();

    return {
      NEO4J_URI: auraDetails.uri,
      NEO4J_USER: auraDetails.user,
      NEO4J_PASSWORD: auraDetails.password,
    };
  } else {
    showNeo4jDiagram();
    console.log(chalk.cyan("\nPlease follow the instructions above to set up Neo4j Desktop."));
    console.log(
      chalk.cyan("Your .env file will be configured with the default local credentials.")
    );
    // Return default local credentials
    return {
      NEO4J_URI: "bolt://localhost:7687",
      NEO4J_USER: "neo4j",
      NEO4J_PASSWORD: "stigmergy123",
    };
  }
}

async function addStartScript() {
  const packageJsonPath = path.join(CWD, "package.json");
  if (!(await fs.pathExists(packageJsonPath))) {
    console.warn(
      chalk.yellow(
        `\nWarning: Could not find package.json. Please add the following script to your package.json manually:\n  "stigmergy:start": "stigmergy start"`
      )
    );
    return;
  }
  const packageJson = await fs.readJson(packageJsonPath);
  if (!packageJson.scripts) {
    packageJson.scripts = {};
  }
  packageJson.scripts["stigmergy:start"] = "stigmergy start";
  await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
}

export async function configureIde(coreSourceDir, outputPath = path.join(CWD, ".roomodes")) {
  const PORT = process.env.PORT || 3000;
  const ENGINE_URL = `http://localhost:${PORT}`;

  // Load the agent manifest to map aliases to agent IDs
  const manifestPath = path.join(coreSourceDir, "system_docs", "02_Agent_Manifest.md");
  const manifestContent = await fs.readFile(manifestPath, "utf8");
  const manifestYamlMatch = manifestContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!manifestYamlMatch) {
    throw new Error(`Could not parse YAML from manifest file: ${manifestPath}`);
  }
  const manifest = yaml.load(manifestYamlMatch[1]);
  const aliasToIdMap = manifest.agents.reduce((acc, agent) => {
    acc[agent.alias] = agent.id;
    return acc;
  }, {});

  const modes = [
    {
      slug: "system",
      name: "⚙️ System Control",
      roleDefinition: "Handles all system operations",
      source: "project",
      api: {
        url: `${ENGINE_URL}/api/chat`,
        method: "POST",
        static_payload: { agentId: "system" },
      },
    },
    {
      slug: "gemma",
      name: "✨ Gemma",
      roleDefinition:
        "I am Gemma, a specialist agent. My purpose is to translate a development task into a single, highly-effective prompt for the Gemini CLI tool. I do not write code myself; I craft the instructions that guide the Gemini CLI to write the code.",
      groups: ["read", "edit", "command", "mcp"],
      source: "project",
    },
    {
      slug: "sally",
      name: "🎨 Sally",
      roleDefinition:
        "I am a UX Expert specializing in user experience design and creating intuitive interfaces. My work informs the product and architectural plans to ensure we build something people love.",
      groups: ["browser", "edit", "mcp", "read"],
      source: "project",
    },
    {
      slug: "vinci",
      name: "🎨 Vinci (Designer)",
      roleDefinition: "You are the design agent.",
      groups: ["browser", "edit", "read", "mcp"],
      source: "project",
    },
    {
      slug: "dexter",
      name: "🎯 Dexter",
      roleDefinition:
        "I am Dexter. I am dispatched to fix what is broken. I write a failing test to prove the bug exists, then I fix the code, and I ensure all tests pass before my work is done.",
      groups: ["read", "edit", "command", "mcp"],
      source: "project",
    },
    {
      slug: "winston",
      name: "🏗️ Winston",
      roleDefinition:
        "I am Winston. I translate the product vision from the PRD into a concrete technical architecture and a machine-readable execution plan. I am part of an autonomous planning sequence.",
      groups: ["read", "edit", "browser", "mcp"],
      source: "project",
    },
    {
      slug: "val",
      name: "💰 Val (Valuation)",
      roleDefinition: "You are the valuator agent.",
      groups: ["read", "edit", "mcp"],
      source: "project",
    },
    {
      slug: "james",
      name: "💻 James",
      roleDefinition:
        "I am a developer agent who executes a self-contained 'Task Package'. My first step is always to read the task file and its associated context provided to me. I will use the instructions and context snippets within that package to perform my work.",
      groups: ["read", "edit", "command", "mcp"],
      source: "project",
    },
    {
      slug: "brian",
      name: "📈 Brian (Business)",
      roleDefinition: "You are the business_planner agent.",
      groups: ["browser", "edit", "mcp", "read"],
      source: "project",
    },
    {
      slug: "metis",
      name: "📈 Metis (Auditor)",
      roleDefinition: "You are the meta agent.",
      groups: ["read", "edit", "mcp"],
      source: "project",
    },
    {
      slug: "mary",
      name: "📊 Mary (Analyst)",
      roleDefinition: "You are the analyst agent.",
      groups: ["browser", "edit", "read", "mcp"],
      source: "project",
    },
    {
      slug: "john",
      name: "📋 John (PM)",
      roleDefinition: "You are the pm agent.",
      groups: ["browser", "read", "edit", "mcp"],
      source: "project",
    },
    {
      slug: "whitney",
      name: "📜 Whitney (Whitepaper)",
      roleDefinition: "You are the whitepaper_writer agent.",
      groups: ["read", "edit", "mcp"],
      source: "project",
    },
    {
      slug: "rocco",
      name: "🔧 Rocco",
      roleDefinition:
        "I am the swarm's hands. I improve application code without changing its functionality, apply system upgrades proposed by the Auditor, and act as the janitor to keep the codebase clean.",
      groups: ["read", "edit", "command", "mcp"],
      source: "project",
    },
    {
      slug: "saul",
      name: "🧠 Saul (Dispatcher)",
      roleDefinition: "You are the dispatcher agent.",
      groups: ["read", "edit"],
      source: "project",
    },
    {
      slug: "quinn",
      name: "🛡️ Quinn",
      roleDefinition:
        "I am the guardian of quality. I act as the first check on the Foreman's blueprint, identifying risks and enforcing schema integrity before they become bugs. I then act as the final check on the developer's code.",
      groups: ["command", "read", "edit", "mcp"],
      source: "project",
    },
  ];

  for (const mode of modes) {
    if (mode.source === "project") {
      const agentId = aliasToIdMap[mode.slug];
      if (agentId) {
        const agentMdPath = path.join(coreSourceDir, "agents", `${agentId}.md`);
        if (await fs.pathExists(agentMdPath)) {
          const agentContent = await fs.readFile(agentMdPath, "utf8");
          const yamlMatch =
            agentContent.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/) ||
            agentContent.match(/([\s\S]*)/);
          if (yamlMatch) {
            const agentData = yaml.load(yamlMatch[1]);
            if (agentData.persona && agentData.persona.role) {
              mode.roleDefinition = agentData.persona.role;
            }
            if (agentData.agent && agentData.agent.name && agentData.agent.icon) {
              mode.name = `${agentData.agent.icon} ${agentData.agent.name}`;
            }
          }
        }
        // Add the API configuration for project-sourced agents
        mode.api = {
          url: `${ENGINE_URL}/api/chat`,
          method: "POST",
          include: ["history"],
          static_payload: { agentId: agentId },
        };
      }
    }
  }

  modes.sort((a, b) => a.name.localeCompare(b.name));
  const yamlOutput = yaml.dump({ customModes: modes }, { lineWidth: -1 });
  const fileContent = `# This file is auto-generated by 'stigmergy install'.\n\n${yamlOutput}`;
  await fs.writeFile(outputPath, fileContent, "utf8");
}

export async function run() {
  const precheckResults = await runPreChecks();
  const failedChecks = Object.entries(precheckResults).filter(([, r]) => !r.valid);

  if (failedChecks.length > 0) {
    console.error(chalk.bold.red("Pre-installation checks failed:"));
    for (const [name, result] of failedChecks) {
      console.error(chalk.red(`  - ${name}: ${result.error || "Failed"}`));
    }
    throw new Error("Pre-installation checks failed. Please fix the issues above and try again.");
  }
  console.log(chalk.green("✅ Pre-installation checks passed."));

  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    spinner.text = "Copying core files...";
    const coreDestDir = path.join(CWD, ".stigmergy-core");
    if (CORE_SOURCE_DIR !== coreDestDir) {
      await fs.copy(CORE_SOURCE_DIR, coreDestDir, { overwrite: true });
    }

    spinner.text = "Configuring Neo4j...";
    const neo4jConfig = await configureNeo4j();
    spinner.succeed("Neo4j configuration selected.");

    spinner.text = "Configuring environment file...";
    const exampleEnvPath = path.join(__dirname, "..", ".env.example");
    const projectEnvPath = path.join(CWD, ".env");

    let envContent = "";
    if (await fs.pathExists(projectEnvPath)) {
      envContent = await fs.readFile(projectEnvPath, "utf8");
    } else {
      envContent = await fs.readFile(exampleEnvPath, "utf8");
    }

    // Update Neo4j variables
    envContent = envContent.replace(/^NEO4J_URI=.*$/m, `NEO4J_URI=${neo4jConfig.NEO4J_URI}`);
    envContent = envContent.replace(/^NEO4J_USER=.*$/m, `NEO4J_USER=${neo4jConfig.NEO4J_USER}`);
    envContent = envContent.replace(
      /^NEO4J_PASSWORD=.*$/m,
      `NEO4J_PASSWORD=${neo4jConfig.NEO4J_PASSWORD}`
    );

    await fs.writeFile(projectEnvPath, envContent, "utf8");
    spinner.succeed("Environment file configured.");

    spinner.text = "Configuring IDE integration...";
    await configureIde(CORE_SOURCE_DIR);
    spinner.succeed("IDE integration configured in .roomodes");

    spinner.text = "Adding start script to package.json...";
    await addStartScript();
    spinner.succeed("Start script added to package.json.");

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Fill in your API keys in the `.env` file.");
    console.log("  2. If using local Neo4j, ensure it's running.");
    console.log("  3. Run 'npm run stigmergy:start' to launch the engine.");
    message_user(
      "I have implemented the cloud integration and visual guide for Neo4j setup. As requested, the AuraDB integration is a placeholder. Please provide the actual API details if you want me to implement the real integration. For now, it returns mock data.",
      true
    );
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.bold.red("Error:"), chalk.red(error.message));
    throw error;
  }
}
