const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const glob = require('glob');

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, '.stigmergy-core');
    this.cache = new Map();
  }

  async parseAgentFile(agentId) {
    const agentPath = path.join(this.stigmergyCore, 'agents', `${agentId}.md`);
    if (!await fs.pathExists(agentPath)) {
        throw new Error(`Agent file does not exist: ${agentPath}`);
    }
    const agentContent = await fs.readFile(agentPath, 'utf8');
    const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
    if (!yamlMatch || !yamlMatch[1]) {
      throw new Error(`Could not find a valid YAML block in agent file: ${agentPath}`);
    }
    const agentConfig = yaml.load(yamlMatch[1]);
    return { agentId, agentPath, agentContent, agentConfig };
  }

  async resolveAgentDependencies(agentId) {
    const { agentPath, agentContent, agentConfig } = await this.parseAgentFile(agentId);
    
    const dependencies = {
      agent: { id: agentId, path: agentPath, content: agentContent, config: agentConfig },
      resources: []
    };
    
    // Some agents might have dependencies defined in their prompt.
    // This is where you would add logic to parse the agent prompt for
    // references to tasks, checklists, etc., and load them as resources.
    // For now, we'll keep it simple.

    return dependencies;
  }

  async listAgents() {
    try {
      const agentDir = path.join(this.stigmergyCore, 'agents');
      const files = await fs.readdir(agentDir);
      return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
    } catch (error) {
        console.error("Could not list agents. Does the '.stigmergy-core/agents' directory exist?", error);
        return [];
    }
  }
}

module.exports = DependencyResolver;
