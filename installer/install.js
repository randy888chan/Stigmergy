import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import chalk from "chalk";
import ora from "ora";
import "dotenv/config.js";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CORE_SOURCE_DIR = path.resolve(__dirname, "..", ".stigmergy-core");
const CWD = process.cwd();

function parseAgentConfig(content) {
  // Use the first capture group (the actual YAML) from the regex match
  const yamlMatch = content.match(/```(?:yaml|yml)\n([\s\S]*?)\s*```/);
  if (!yamlMatch) return null;
  try {
    // yamlMatch[1] is the actual YAML content
    return yaml.load(yamlMatch[1]);
  } catch (e) {
    console.warn(chalk.yellow(`Warning: Could not parse agent YAML. ${e.message}`));
    return null;
  }
}

function buildRoleDefinition(agentConfig) {
  if (!agentConfig || !agentConfig.agent || !agentConfig.persona) {
    return "This is a Stigmergy AI agent.";
  }
  const { identity, core_protocols } = agentConfig.persona;
  let definition = identity || "No identity defined.";
  if (core_protocols && Array.isArray(core_protocols)) {
    definition += "\n\n--- CORE PROTOCOLS ---\n" + core_protocols.map((p) => `- ${p}`).join("\n");
  }
  return definition;
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
      slug: "system-pause",
      name: "⏸️ Pause Engine",
      roleDefinition: "Pause the autonomous engine.",
      api: { url: `${ENGINE_URL}/api/control/pause`, method: "POST" },
      groups: ["command"],
    },
    {
      slug: "system-resume",
      name: "▶️ Resume Engine",
      roleDefinition: "Resume the autonomous engine.",
      api: { url: `${ENGINE_URL}/api/control/resume`, method: "POST" },
      groups: ["command"],
    },
    {
      slug: "system-start",
      name: "🚀 Start Project",
      roleDefinition: "Provide a high-level goal to start a new project.",
      api: {
        url: `${ENGINE_URL}/api/system/start`,
        method: "POST",
        body: '{"goal": "{{prompt}}"}',
      },
      groups: ["command"],
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
          const agentConfig = parseAgentConfig(agentContent);
          if (agentConfig) {
            mode.roleDefinition = buildRoleDefinition(agentConfig);
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
  const spinner = ora("🚀 Initializing Stigmergy...").start();
  try {
    spinner.text = "Copying core files...";
    const coreDestDir = path.join(CWD, ".stigmergy-core");
    await fs.copy(CORE_SOURCE_DIR, coreDestDir, { overwrite: true });

    spinner.text = "Configuring environment file...";
    const exampleEnvPath = path.join(__dirname, "..", ".env.example");
    const projectEnvPath = path.join(CWD, ".env");
    if (!(await fs.pathExists(projectEnvPath))) {
      await fs.copy(exampleEnvPath, projectEnvPath);
    }

    spinner.text = "Configuring IDE integration...";
    await configureIde(CORE_SOURCE_DIR);
    spinner.succeed("IDE integration configured in .roomodes");

    spinner.text = "Adding start script to package.json...";
    await addStartScript();
    spinner.succeed("Start script added to package.json.");

    console.log(chalk.bold.green("\n✅ Stigmergy installation complete!"));
    console.log(chalk.cyan("Next steps:"));
    console.log("  1. Fill in your API keys in the `.env` file.");
    console.log("  2. Run 'npm run stigmergy:start' to launch the engine.");
  } catch (error) {
    spinner.fail("Installation failed.");
    console.error(chalk.bold.red("Error:"), chalk.red(error.message));
    throw error;
  }
}
