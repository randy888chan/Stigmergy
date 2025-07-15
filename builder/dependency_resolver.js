const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const { marked } = require("marked");

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, ".stigmergy-core");
  }

  async parseAgentFile(agentId) {
    const agentPath = path.join(this.stigmergyCore, "agents", `${agentId}.md`);
    if (!(await fs.pathExists(agentPath))) {
      throw new Error(`Agent file does not exist: ${agentPath}`);
    }
    const agentContent = await fs.readFile(agentPath, "utf8");
    const yamlMatch = agentContent.match(/```(yaml|yml)\n([\s\S]*?)```/i);
    if (!yamlMatch || !yamlMatch[2]) {
      console.warn(`Could not find a valid YAML block in agent file: ${agentPath}`);
      return { agentId, agentPath, agentContent, agentConfig: {} };
    }
    const agentConfig = yaml.load(yamlMatch[2]);
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
      // Regex to find relative paths within text, links, and code blocks
      const pathRegex = /[`'"]?((?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_-]+\.(?:md|yml|yaml|json))[`'"]?/g;

      let textToSearch = "";
      if (token.type === "link") {
        textToSearch = token.href || "";
      } else if (token.type === "text" || (token.type === "code" && token.lang !== "yaml")) {
        textToSearch = token.text || "";
      }

      let match;
      while ((match = pathRegex.exec(textToSearch)) !== null) {
        // Correctly use the captured group `match[1]` which contains the clean path
        const relPath = path.normalize(match[1]);
        if (relPath && !resourceMap.has(relPath)) {
          resourceMap.set(relPath, ""); // Placeholder to prevent re-entry
          promises.push(this.loadFileContent(relPath, resourceMap));
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
        const fileContent = await fs.readFile(fullPath, "utf8");
        resourceMap.set(relativePath, fileContent);
        // Recursively find dependencies in the new file
        await this.findDependenciesInContent(fileContent, resourceMap);
      } else {
        console.warn(`Dependency not found, skipping: ${relativePath}`);
      }
    } catch (e) {
      console.error(`Could not load dependency: ${relativePath}`, e.message);
    }
  }

  async listAgents() {
    const agentDir = path.join(this.stigmergyCore, "agents");
    const files = await fs.readdir(agentDir);
    return files.filter((f) => f.endsWith(".md")).map((f) => path.basename(f, ".md"));
  }

  async listTeams() {
    const teamDir = path.join(this.stigmergyCore, "agent-teams");
    const files = await fs.readdir(teamDir);
    return files.filter((f) => f.endsWith(".yml")).map((f) => path.basename(f, ".yml"));
  }
}

module.exports = DependencyResolver;
