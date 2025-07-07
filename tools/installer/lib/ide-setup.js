const path = require("path");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const yaml = require('js-yaml');

// Dynamic import for ES module
let chalk;

// Initialize ES modules
async function initializeModules() {
  if (!chalk) {
    chalk = (await import("chalk")).default;
  }
}

class IdeSetup {
  async setup(ide, installDir) {
    await initializeModules();
    const ideConfig = await configLoader.getIdeConfiguration(ide);

    if (!ideConfig) {
      console.log(chalk.yellow(`\nNo configuration available for ${ide}`));
      return false;
    }

    if (ide === "roo") {
        return this.setupRoo(installDir);
    }
    
    // Legacy support for other IDEs can be maintained or developed here.
    console.log(chalk.yellow(`\nGeneric setup for ${ide} is not fully optimized. Recommending Roo Code.`));
    return false;
  }

  async getAllAgentData(installDir) {
    const agentsDir = path.join(installDir, ".stigmergy-core", "agents");
    const glob = require("glob");
    const agentFiles = glob.sync("*.md", { cwd: agentsDir });
    const agentDataList = [];

    for (const file of agentFiles) {
        const agentId = path.basename(file, ".md");
        const agentPath = path.join(agentsDir, file);
        const agentContent = await fileManager.readFile(agentPath);

        const yamlMatch = agentContent.match(/```ya?ml\n([\s\S]*?)```/);
        if (yamlMatch) {
            try {
                const config = yaml.load(yamlMatch);
                agentDataList.push({
                    id: agentId,
                    config: config,
                    fullContent: agentContent,
                });
            } catch (e) {
                console.warn(chalk.yellow(`Could not parse YAML for agent: ${agentId}. Skipping.`));
            }
        }
    }
    return agentDataList;
  }

  async setupRoo(installDir) {
    const allAgentsData = await this.getAllAgentData(installDir);
    const roomodesPath = path.join(installDir, ".roomodes");

    let existingModes = { customModes: [] };
    if (await fileManager.pathExists(roomodesPath)) {
        try {
            const existingContent = await fileManager.readFile(roomodesPath);
            existingModes = yaml.load(existingContent) || { customModes: [] };
            if (!Array.isArray(existingModes.customModes)) {
                existingModes.customModes = [];
            }
            console.log(chalk.yellow(`Found existing .roomodes file. Merging new modes.`));
        } catch (e) {
            console.warn(chalk.yellow(`Could not parse existing .roomodes file. It will be overwritten.`));
        }
    }

    const existingSlugs = new Set(existingModes.customModes.map(m => m.slug));

    for (const agentData of allAgentsData) {
        const slug = `${agentData.id}`; // Simplified slug
        if (existingSlugs.has(slug)) {
            console.log(chalk.dim(`Skipping mode for '${agentData.config.agent.name}' - slug '${slug}' already exists.`));
            continue;
        }

        const newMode = {
            slug,
            name: `${agentData.config.agent.icon} ${agentData.config.agent.name}`,
            roleDefinition: agentData.config.persona.identity,
            whenToUse: agentData.config.agent.whenToUse,
            customInstructions: agentData.fullContent,
            groups: ['read', 'edit'] // Grant full access by default for simplicity
        };
        
        existingModes.customModes.push(newMode);
        console.log(chalk.green(`✓ Prepared mode: ${newMode.name}`));
    }
    
    try {
        const finalYaml = yaml.dump(existingModes, {
          indent: 2,
          noRefs: true,
          sortKeys: false
        });

        await fileManager.writeFile(roomodesPath, finalYaml);
        console.log(chalk.green("\n✓ Successfully created/updated .roomodes file for Roo Code."));
        console.log(chalk.dim("Custom agent modes will be available the next time you open this project in Roo Code."));
        return true;
    } catch (e) {
        console.error(chalk.red('Failed to write .roomodes file:'), e);
        return false;
    }
  }
}

module.exports = new IdeSetup();
