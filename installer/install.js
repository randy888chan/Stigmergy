import fs from "fs-extra";
import path from "path";
import yaml from "js-yaml";
import chalk from "chalk";
import ora from "ora";
import "dotenv/config.js";
import { fileURLToPath } from "url";

const CORE_SOURCE_DIR = path.join(process.cwd(), ".stigmergy-core");
const CWD = process.cwd();

/**
 * Parses the YAML frontmatter from an agent's markdown file.
 */
function parseAgentConfig(content) {
  const yamlMatch = content.match(/```(yaml|yml)?\n([\s\S]*?)\n```/);
  if (!yamlMatch) return null;
  try {
    return yaml.load(yamlMatch[2]);
  } catch (e) {
    console.warn(chalk.yellow(`Warning: Could not parse agent YAML. ${e.message}`));
    return null;
  }
}

/**
 * Builds the rich role definition from the agent's persona.
 */
function buildRoleDefinition(agentConfig) {
  if (!agentConfig || !agentConfig.persona) {
    return "This is a Stigmergy AI agent.";
  }
  const { identity, core_protocols } = agentConfig.persona;
  let definition = identity || "No identity defined.";
  if (core_protocols && Array.isArray(core_protocols)) {
    definition += "\n\n--- CORE PROTOCOLS ---\n" + core_protocols.map((p) => `- ${p}`).join("\n");
  }
  return definition;
}

/**
 * *** NEW: This is the critical function that correctly maps tools to UI permissions. ***
 * Translates tool permissions from the manifest into Roo Code UI groups.
 * @param {string[]} tools - The list of tools an agent can use (e.g., ["file_system.writeFile", "shell.execute"]).
 * @returns {string[]} The corresponding UI groups (e.g., ["edit", "command"]).
 */
function mapToolsToGroups(tools = []) {
  const groups = new Set();
  // All agents can implicitly read files if they have any file system tool.
  if (tools.some((tool) => tool.startsWith("file_system"))) {
    groups.add("read");
  }
  // Agents with write/delete capabilities get the powerful 'edit' group.
  if (
    tools.some(
      (tool) => tool.startsWith("file_system.write") || tool.startsWith("file_system.delete")
    )
  ) {
    groups.add("edit");
  }
  // Agents that can execute shell commands get the 'command' group.
  if (tools.some((tool) => tool.startsWith("shell.execute"))) {
    groups.add("command");
  }
  // Agents with any web capability get the 'browser' group.
  if (
    tools.some(
      (tool) =>
        tool.startsWith("web.") || tool.startsWith("scraper.") || tool.startsWith("research.")
    )
  ) {
    groups.add("browser");
  }
  // You can add more mappings here, for example, for MCP tools.
  // if (tools.some(tool => tool.startsWith('mcp.'))) {
  //   groups.add('mcp');
  // }
  return Array.from(groups);
}

async function configureIde(coreSourceDir) {
  const modes = [];
  const PORT = process.env.PORT || 3000;
  const ENGINE_URL = `http://localhost:${PORT}`;

  const manifestPath = path.join(coreSourceDir, "system_docs", "02_Agent_Manifest.md");
  const manifestContent = await fs.readFile(manifestPath, "utf8");
  const manifest = yaml.load(manifestContent);

  if (!manifest || !Array.isArray(manifest.agents)) {
    throw new Error("Agent manifest is invalid or not found. Cannot generate IDE configuration.");
  }

  for (const agentEntry of manifest.agents) {
    if (!agentEntry.id || !agentEntry.alias) continue;

    const agentMdPath = path.join(coreSourceDir, "agents", `${agentEntry.id}.md`);
    let roleDefinition = `You are the ${agentEntry.id} agent.`;
    let agentName = agentEntry.name || agentEntry.alias;
    let agentIcon = agentEntry.icon || "🤖";

    // Correctly reads the agent's .md file for the rich persona.
    if (await fs.pathExists(agentMdPath)) {
      const agentContent = await fs.readFile(agentMdPath, "utf8");
      const agentConfig = parseAgentConfig(agentContent);
      if (agentConfig) {
        roleDefinition = buildRoleDefinition(agentConfig);
        agentName = agentConfig.agent.name || agentName;
        agentIcon = agentConfig.agent.icon || agentIcon;
      }
    }

    modes.push({
      slug: agentEntry.alias,
      name: `${agentIcon} ${agentName}`,
      roleDefinition: roleDefinition,
      api: {
        url: `${ENGINE_URL}/api/chat`, // This should point to your MCP server endpoint in the future
        method: "POST",
        include: ["history"],
        static_payload: { agentId: agentEntry.id },
      },
      // *** THE FIX: Correctly maps tools to groups ***
      groups: mapToolsToGroups(agentEntry.tools),
    });
  }

  // Add system control modes
  modes.push({
    slug: "system-start",
    name: "🚀 Start Project",
    roleDefinition: "Provide a high-level goal to start a new project.",
    api: { url: `${ENGINE_URL}/api/system/start`, method: "POST", body: '{"goal": "{{prompt}}"}' },
    groups: ["command"],
  });
  modes.push({
    slug: "system-pause",
    name: "⏸️ Pause Engine",
    roleDefinition: "Pause the autonomous engine.",
    api: { url: `${ENGINE_URL}/api/control/pause`, method: "POST" },
    groups: ["command"],
  });
  modes.push({
    slug: "system-resume",
    name: "▶️ Resume Engine",
    roleDefinition: "Resume the autonomous engine.",
    api: { url: `${ENGINE_URL}/api/control/resume`, method: "POST" },
    groups: ["command"],
  });

  modes.sort((a, b) => a.name.localeCompare(b.name));
  const yamlOutput = yaml.dump({ customModes: modes }, { lineWidth: -1 });
  const fileContent = `# This file is auto-generated by 'stigmergy install'.\n\n${yamlOutput}`;
  await fs.writeFile(path.join(CWD, ".roomodes"), fileContent, "utf8");
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
