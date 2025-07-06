const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.bmadCore = path.join(rootDir, 'bmad-core');
    this.cache = new Map();
  }

  async resolveAgentDependencies(agentId) {
    const agentPath = path.join(this.bmadCore, 'agents', `${agentId}.md`);
    const agentContent = await fs.readFile(agentPath, 'utf8');

    // Robustly find the YAML block in the agent's markdown file.
    const lines = agentContent.split(/\r?\n/);
    let inYamlBlock = false;
    const yamlLines = [];
    for (const line of lines) {
      if (line.trim().startsWith('```yaml') || line.trim().startsWith('```yml')) {
        inYamlBlock = true;
        continue;
      }
      if (line.trim() === '```' && inYamlBlock) {
        break;
      }
      if (inYamlBlock) {
        yamlLines.push(line);
      }
    }
    const yamlContent = yamlLines.join('\n');
    if (!yamlContent) {
      throw new Error(`Could not find or parse a valid YAML block in agent file: ${agentPath}`);
    }
    
    const agentConfig = yaml.load(yamlContent);
    
    const dependencies = {
      agent: { id: agentId, path: `agents#${agentId}`, content: agentContent, config: agentConfig },
      resources: []
    };

    const depTypes = ['tasks', 'templates', 'checklists', 'data', 'utils', 'agents', 'system_docs'];
    for (const depType of depTypes) {
      const deps = agentConfig.dependencies?.[depType] || [];
      const depList = Array.isArray(deps) ? deps : [deps]; // Handle single string or array

      for (const depId of depList) {
        if (depId === '*' || depType === 'agents') continue; // Do not bundle other agents or wildcard deps
        const resource = await this.loadResource(depType, depId);
        if (resource) dependencies.resources.push(resource);
      }
    }

    return dependencies;
  }

  async resolveTeamDependencies(teamId) {
    const teamPath = path.join(this.bmadCore, 'agent-teams', `${teamId}.yml`);
    const teamContent = await fs.readFile(teamPath, 'utf8');
    const teamConfig = yaml.load(teamContent);
    
    const dependencies = {
      team: { id: teamId, path: `agent-teams#${teamId}`, content: teamContent, config: teamConfig },
      agents: [],
      resources: new Map()
    };

    let agentsToResolve = teamConfig.agents || [];
    
    // Handle wildcard agent resolution
    if (agentsToResolve.includes('*')) {
      const allAgents = await this.listAgents();
      // Exclude master orchestrator from wildcard to prevent recursion issues in some contexts
      agentsToResolve = allAgents.filter(a => a !== 'bmad-master'); 
    }
    
    for (const agentId of agentsToResolve) {
      try {
        const agentDeps = await this.resolveAgentDependencies(agentId);
        dependencies.agents.push(agentDeps.agent);
        agentDeps.resources.forEach(res => dependencies.resources.set(res.path, res));
      } catch (error) {
        console.warn(chalk.yellow(`[Warning] Could not resolve dependencies for agent '${agentId}' in team '${teamId}'. Skipping. Reason: ${error.message}`));
      }
    }

    if (teamConfig.workflows) {
      for (const workflowId of teamConfig.workflows) {
        const resource = await this.loadResource('workflows', workflowId);
        if (resource) dependencies.resources.set(resource.path, resource);
      }
    }

    dependencies.resources = Array.from(dependencies.resources.values());
    return dependencies;
  }

  async loadResource(type, id) {
    const cacheKey = `${type}#${id}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
  
    const extensions = type === 'workflows' ? ['.yml'] : ['.md'];
    let content = null;
    let filePath = '';
  
    const resourcePath = path.join(this.bmadCore, type, id);
  
    for (const ext of extensions) {
      try {
        const testPath = id.endsWith(ext) ? resourcePath : `${resourcePath}${ext}`;
        if ((await fs.stat(testPath)).isFile()) {
          content = await fs.readFile(testPath, 'utf8');
          filePath = `${type}#${id}`;
          break;
        }
      } catch (e) {
        // File does not exist, try next extension
      }
    }
  
    if (!content) {
      // console.warn(`[Warning] Resource not found: ${id} in ${type}. Skipping.`);
      return null;
    }
  
    const resource = { type, id, path: filePath, content };
    this.cache.set(cacheKey, resource);
    return resource;
  }
  
  async listAgents() {
    try {
      const files = await fs.readdir(path.join(this.bmadCore, 'agents'));
      return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
    } catch (error) { return []; }
  }

  async listTeams() {
    try {
      const files = await fs.readdir(path.join(this.bmadCore, 'agent-teams'));
      return files.filter(f => f.endsWith('.yml')).map(f => path.basename(f, '.yml'));
    } catch (error) { return []; }
  }
}

module.exports = DependencyResolver;
