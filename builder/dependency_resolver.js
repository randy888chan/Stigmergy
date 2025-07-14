const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { glob } = require('glob');

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, '.stigmergy-core');
    this.cache = new Map();
  }

  async parseAgentFile(agentId) {
    const agentPath = path.join(this.stigmergyCore, 'agents', `${agentId}.md`);
    if (!(await fs.pathExists(agentPath))) {
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
    if (this.cache.has(agentId)) {
      return this.cache.get(agentId);
    }

    const { agentPath, agentContent, agentConfig } = await this.parseAgentFile(agentId);

    const dependencies = {
      agent: { id: agentId, path: agentPath, content: agentContent, config: agentConfig },
      resources: new Map(), // Use a map to prevent duplicates
    };

    await this.findDependenciesInContent(agentContent, dependencies.resources);

    const resolvedResources = [];
    for (const [relativePath, content] of dependencies.resources.entries()) {
        resolvedResources.push({
            path: path.join(this.stigmergyCore, relativePath),
            content,
            relativePath
        });
    }

    const finalDependencies = { ...dependencies, resources: resolvedResources };
    this.cache.set(agentId, finalDependencies);
    return finalDependencies;
  }
  
  async findDependenciesInContent(content, resourceMap) {
    // Regex to find markdown links or other file paths relative to .stigmergy-core
    // e.g., `(docs/architecture.md)` or `../system_docs/03_Core_Principles.md` or `tasks/create-brief.md`
    const regex = /[`'"]?(\.?\.?\/[a-zA-Z0-9_\-\/]+\.(md|yml|yaml|json))[`'"]?/g;
    let match;
    const promises = [];

    while ((match = regex.exec(content)) !== null) {
        const relativePath = path.normalize(match[1]);
        if (!resourceMap.has(relativePath)) { // Avoid reprocessing
            resourceMap.set(relativePath, ''); // Placeholder to prevent re-entry
            
            promises.push(
              (async () => {
                const fullPath = path.join(this.stigmergyCore, relativePath);
                if (await fs.pathExists(fullPath)) {
                  const fileContent = await fs.readFile(fullPath, 'utf8');
                  resourceMap.set(relativePath, fileContent);
                  // Recursively find dependencies in the new file
                  await this.findDependenciesInContent(fileContent, resourceMap);
                }
              })()
            );
        }
    }
    await Promise.all(promises);
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
