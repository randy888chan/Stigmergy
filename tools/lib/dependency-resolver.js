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

    // [[LLM-ENHANCEMENT]] This is the final, robust parsing logic.
    // It reads the file line by line to guarantee it finds the YAML block correctly.
    const lines = agentContent.split(/\r?\n/);
    let inYamlBlock = false;
    const yamlLines = [];

    for (const line of lines) {
      if (line.trim().startsWith('```yaml') || line.trim().startsWith('```yml')) {
        inYamlBlock = true;
        continue; // Don't include the opening tag in the content
      }
      if (line.trim() === '```' && inYamlBlock) {
        break; // Found the closing tag, end of the block
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

    const depTypes = ['tasks', 'templates', 'checklists', 'data', 'utils', 'agents'];
    for (const depType of depTypes) {
      const deps = agentConfig.dependencies?.[depType] || [];
      for (const depId of deps) {
        if (depType === 'agents') continue;
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
    
    if (agentsToResolve.includes('*')) {
      const allAgents = await this.listAgents();
      agentsToResolve = allAgents.filter(a => a !== 'bmad-master');
    }
    
    for (const agentId of agentsToResolve) {
      const agentDeps = await this.resolveAgentDependencies(agentId);
      dependencies.agents.push(agentDeps.agent);
      agentDeps.resources.forEach(res => dependencies.resources.set(res.path, res));
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

    const extensions = ['.md', '.yml', '.yaml'];
    let content = null;
    let filePath = '';
    
    const possiblePaths = [
        path.join(this.rootDir, id), // For full paths like 'expansion-packs/...'
        path.join(this.bmadCore, type, id) // For core dependencies
    ];

    for (const basePath of possiblePaths) {
        for (const ext of extensions) {
            try {
                const testPath = id.endsWith(ext) ? basePath : `${basePath}${ext}`;
                if ((await fs.stat(testPath)).isFile()) {
                    content = await fs.readFile(testPath, 'utf8');
                    // Determine the correct "path" for the manifest
                    filePath = path.relative(this.rootDir, testPath).startsWith('bmad-core') 
                        ? `${type}#${id}` 
                        : path.relative(this.rootDir, testPath);
                    break;
                }
            } catch (e) {}
        }
        if (content) break;
    }

    if (!content) {
      console.warn(`[Warning] Resource not found: ${id} in ${type}. Skipping.`);
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