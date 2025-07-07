const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, '.stigmergy-core');
    this.cache = new Map();
  }

  async resolveAgentDependencies(agentId) {
    const agentPath = path.join(this.stigmergyCore, 'agents', `${agentId}.md`);
    const agentContent = await fs.readFile(agentPath, 'utf8');

    const yamlMatch = agentContent.match(/```ya?ml\n([\s\S]*?)```/);
    if (!yamlMatch || !yamlMatch) {
      throw new Error(`Could not find or parse a valid YAML block in agent file: ${agentPath}`);
    }
    
    const agentConfig = yaml.load(yamlMatch);
    
    const dependencies = {
      agent: { id: agentId, path: `agents#${agentId}`, content: agentContent, config: agentConfig },
      resources: []
    };

    const depTypes = ['tasks', 'templates', 'checklists', 'data', 'utils', 'system_docs'];
    for (const depType of depTypes) {
      if (!agentConfig.dependencies || !agentConfig.dependencies[depType]) continue;
      
      const deps = agentConfig.dependencies[depType];
      const depList = Array.isArray(deps) ? deps : [deps];

      for (const depId of depList) {
        if (depId === '*' || depType === 'agents') continue;
        const resource = await this.loadResource(depType, depId);
        if (resource) dependencies.resources.push(resource);
      }
    }

    return dependencies;
  }

  async resolveTeamDependencies(teamId) {
    const teamPath = path.join(this.stigmergyCore, 'agent-teams', `${teamId}.yml`);
    const teamContent = await fs.readFile(teamPath, 'utf8');
    const teamConfig = yaml.load(teamContent);
    
    const dependencies = {
      team: { id: teamId, path: `agent-teams#${teamId}`, content: teamContent, config: teamConfig },
      agents: [],
      resources: new Map()
    };

    let agentsToResolve = teamConfig.agents || [];
    
    if (agentsToResolve.includes('*')) {
      const allAgents = await this.listAgents();
      agentsToResolve = allAgents.filter(a => a !== 'stigmergy-master'); 
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
    
    // NOTE: Workflows are no longer a separate dependency type. They are part of agent protocols.
    // This section is removed to align with the new architecture.

    dependencies.resources = Array.from(dependencies.resources.values());
    return dependencies;
  }

  async loadResource(type, id) {
    const cacheKey = `${type}#${id}`;
    if (this.cache.has(cacheKey)) return this.cache.get(cacheKey);
  
    // Define extensions for different resource types
    const ext = type.endsWith('s') ? '.md' : '.yml'; // Simple rule, can be expanded
    const resourceFileName = `${id}${ext}`;
    const resourcePath = path.join(this.stigmergyCore, type, resourceFileName);
  
    try {
      await fs.access(resourcePath); // Check if file exists
      const content = await fs.readFile(resourcePath, 'utf8');
      const resource = { type, id, path: `${type}#${id}`, content };
      this.cache.set(cacheKey, resource);
      return resource;
    } catch (e) {
      // Intentionally silent: It's valid for a dependency to not exist after cleanup.
      // console.warn(`[Info] Resource not found: ${id} in ${type}. Skipping.`);
      return null;
    }
  }
  
  async listAgents() {
    try {
      const files = await fs.readdir(path.join(this.stigmergyCore, 'agents'));
      return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
    } catch (error) { return []; }
  }

  async listTeams() {
    try {
      const files = await fs.readdir(path.join(this.stigmergyCore, 'agent-teams'));
      return files.filter(f => f.endsWith('.yml')).map(f => path.basename(f, '.yml'));
    } catch (error) { return []; }
  }
}

module.exports = DependencyResolver;
