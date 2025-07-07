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
                console.log(chalk.yellow(`Found existing .roomodes file. Merging new modes.`));
            } else {
                console.warn(chalk.yellow('Existing .roomodes file is malformed. It will be overwritten.'));
            }
        } catch (e) {
            console.warn(chalk.yellow(`Could not parse existing .roomodes file. It will be overwritten. Error: ${e.message}`));
        }
    }

    const existingSlugs = new Set(existingModes.customModes.map(m => m.slug));

    for (const agentData of allAgentsData) {
        const slug = agentData.id;
        if (existingSlugs.has(slug)) {
            console.log(chalk.dim(`Skipping mode for '${agentData.config.agent.name}' - slug '${slug}' already exists.`));
            continue;
        }

        const newMode = {
            slug: slug,
            name: `${agentData.config.agent.icon} ${agentData.config.agent.name}`,
            roleDefinition: agentData.config.persona.identity,
            whenToUse: agentData.config.agent.whenToUse,
            customInstructions: agentData.fullContent,
            groups: ['read', 'edit'] // Grant full access by default for simplicity.
        };
        
        existingModes.customModes.push(newMode);
        console.log(chalk.green(`✓ Prepared mode: ${newMode.name}`));
    }
    
    try {
        const finalYaml = yaml.dump(existingModes, {
          indent: 2,
          noRefs: true,
          sortKeys: false,
          lineWidth: -1, // Prevent line wrapping for customInstructions
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
