const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { marked } = require('marked'); // Using a real markdown parser

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, '.stigmergy-core');
  }

  async parseAgentFile(agentId) {
    const agentPath = path.join(this.stigmergyCore, 'agents', `${agentId}.md`);
    if (!(await fs.pathExists(agentPath))) {
      throw new Error(`Agent file does not exist: ${agentPath}`);
    }
    const agentContent = await fs.readFile(agentPath, 'utf8');
    const yamlMatch = agentContent.match(/```yaml\n([\s\S]*?)```/);
    if (!yamlMatch || !yamlMatch) {
      throw new Error(`Could not find a valid YAML block in agent file: ${agentPath}`);
    }
    const agentConfig = yaml.load(yamlMatch);
    return { agentId, agentPath, agentContent, agentConfig };
  }

  async resolveAgentDependencies(agentId) {
    const { agentPath, agentContent, agentConfig } = await this.parseAgentFile(agentId);

    const resourceMap = new Map();
    await this.findDependenciesInContent(agentContent, resourceMap);
    
    const resources = [];
    for (const [relativePath, content] of resourceMap.entries()) {
      resources.push({
        path: path.join(this.stigmergyCore, relativePath),
        content,
        relativePath,
      });
    }

    return {
      agent: { id: agentId, path: agentPath, content: agentContent, config: agentConfig },
      resources,
    };
  }

  async findDependenciesInContent(content, resourceMap) {
    const tokens = marked.lexer(content);
    const promises = [];

    marked.walkTokens(tokens, (token) => {
      let potentialPath = null;
      if (token.type === 'link') {
        potentialPath = token.href;
      } else if (token.type === 'text' || (token.type === 'code' && token.lang !== 'yaml')) {
        // A simpler regex for finding paths inside text or code blocks
        const pathRegex = /[`'"]?([a-zA-Z0-9_\-\/]+\.(md|yml|yaml|json))[`'"]?/g;
        let match;
        while((match = pathRegex.exec(token.text)) !== null) {
            const relPath = path.normalize(match);
            if (!resourceMap.has(relPath)) {
                resourceMap.set(relPath, ''); // Placeholder
                promises.push(this.loadFileContent(relPath, resourceMap));
            }
        }
      }

      if (potentialPath) {
        const relativePath = path.normalize(potentialPath);
        if (!resourceMap.has(relativePath)) {
          resourceMap.set(relativePath, ''); // Placeholder to prevent re-entry
          promises.push(this.loadFileContent(relativePath, resourceMap));
        }
      }
    });

    await Promise.all(promises);
  }

  async loadFileContent(relativePath, resourceMap) {
      try {
        const fullPath = path.resolve(this.stigmergyCore, relativePath);
        // Security check
        if (!fullPath.startsWith(this.stigmergyCore)) {
            console.warn(`Skipping path outside of .stigmergy-core: ${relativePath}`);
            return;
        }

        if (await fs.pathExists(fullPath)) {
            const fileContent = await fs.readFile(fullPath, 'utf8');
            resourceMap.set(relativePath, fileContent);
            // Recursively find dependencies in the new file
            await this.findDependenciesInContent(fileContent, resourceMap);
        }
      } catch (e) {
          console.error(`Could not load dependency: ${relativePath}`, e.message);
      }
  }

  async listAgents() {
    const agentDir = path.join(this.stigmergyCore, 'agents');
    const files = await fs.readdir(agentDir);
    return files.filter(f => f.endsWith('.md')).map(f => path.basename(f, '.md'));
  }
}

module.exports = DependencyResolver;
