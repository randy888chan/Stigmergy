const path = require("path");
const fileManager = require("./file-manager");
const configLoader = require("./config-loader");
const yaml = require('js-yaml');

let chalk;

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
    
    console.log(chalk.yellow(`\nSetup for ${ide} is not yet fully implemented.`));
    return false;
  }

  async setupRoo(installDir) {
    const allAgentsData = await configLoader.getAgentDataList();
    const roomodesPath = path.join(installDir, ".roomodes");

    let existingModes = { customModes: [] };
    if (await fileManager.pathExists(roomodesPath)) {
        try {
            const existingContent = await fileManager.readFile(roomodesPath);
            const loadedYaml = yaml.load(existingContent);
            if (loadedYaml && Array.isArray(loadedYaml.customModes)) {
                existingModes = loadedYaml;
            }
        } catch (e) {
            console.warn(chalk.yellow(`Could not parse existing .roomodes file. It will be overwritten.`));
        }
    }

    const existingSlugs = new Set(existingModes.customModes.map(m => m.slug));

    for (const agentData of allAgentsData) {
        // Use the alias as the primary slug to avoid IDE conflicts. Fallback to id.
        const slug = agentData.config.agent.alias || agentData.id;
        
        if (existingSlugs.has(slug)) {
            console.log(chalk.dim(`Skipping mode for '${agentData.config.agent.name}' - slug '${slug}' already exists.`));
            continue;
        }

        const newMode = {
            slug: slug,
            name: `${agentData.config.agent.icon} ${agentData.config.agent.name}`, // Use the human name for display
            roleDefinition: agentData.config.persona.identity,
            whenToUse: agentData.config.agent.whenToUse,
            customInstructions: agentData.fullContent,
            groups: ['read', 'edit', 'mcp'] 
        };
        
        existingModes.customModes.push(newMode);
        console.log(chalk.green(`✓ Prepared mode: ${newMode.name} (@${slug})`));
    }
    
    try {
        const finalYaml = yaml.dump(existingModes, {
          indent: 2,
          noRefs: true,
          sortKeys: false,
          lineWidth: -1,
        });

        await fileManager.writeFile(roomodesPath, finalYaml);
        console.log(chalk.green("\n✓ Successfully created/updated .roomodes file for Roo Code."));
        console.log(chalk.dim("Human-friendly aliases are now used to prevent IDE conflicts."));
        return true;
    } catch (e) {
        console.error(chalk.red('Failed to write .roomodes file:'), e);
        return false;
    }
  }
}

module.exports = new IdeSetup();
