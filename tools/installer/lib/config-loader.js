const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const glob = require("glob");

class ConfigLoader {
  constructor() {
    this.configPath = path.join(__dirname, '..', 'config', 'install.config.yml');
    this.config = null;
  }

  async load() {
    if (this.config) return this.config;
    
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      this.config = yaml.load(configContent);
      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  getStigmergyCorePath() {
    return path.join(__dirname, '..', '..', '..', '.stigmergy-core');
  }

  async getIdeConfiguration(ide) {
    const config = await this.load();
    return config['ide-configurations']?.[ide] || null;
  }
  
  async getAgentDataList() {
    const agentsDir = path.join(this.getStigmergyCorePath(), 'agents');
    const agentFiles = glob.sync("*.md", { cwd: agentsDir });
    const agentDataList = [];

    for (const file of agentFiles) {
        const agentId = path.basename(file, ".md");
        const agentPath = path.join(agentsDir, file);
        
        try {
            const agentContent = await fs.readFile(agentPath, 'utf8');
            const yamlMatch = agentContent.match(/```ya?ml\n([\s\S]*?)```/);
            if (yamlMatch && yamlMatch) {
                const config = yaml.load(yamlMatch);
                agentDataList.push({
                    id: agentId,
                    config: config,
                    fullContent: agentContent,
                });
            } else {
                 console.warn(`Could not parse YAML for agent: ${agentId}. Skipping.`);
            }
        } catch(e) {
            console.warn(`Error reading or parsing agent file ${agentId}:`, e.message);
        }
    }
    return agentDataList;
  }
}

module.exports = new ConfigLoader();
