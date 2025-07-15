const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const { marked } = require("marked");

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, ".stigmergy-core");
  }

  async parseFile(filePath, isAgent = false) {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    const content = await fs.readFile(filePath, "utf8");
    if (isAgent) {
        const yamlMatch = content.match(/```(yaml|yml)\n([\s\S]*?)```/i);
        const config = (yamlMatch && yamlMatch) ? yaml.load(yamlMatch) : {};
        return { content, config };
    }
    return { content };
  }

  async resolveDependencies(initialRelativePath) {
    const visited = new Set();
    const dependencies = new Map();
    const queue = [initialRelativePath];
    visited.add(initialRelativePath);

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const fullPath = path.join(this.stigmergyCore, currentPath);
      const { content } = await this.parseFile(fullPath);
      dependencies.set(currentPath, content);

      const pathRegex = /[`'"]?((?:[a-zA-Z0-9_-]+\/)+[a-zA-Z0-9_-]+\.(?:md|yml|yaml|json))[`'"]?/g;
      let match;
      while ((match = pathRegex.exec(content)) !== null) {
        const foundPath = path.normalize(match);
        if (foundPath && !visited.has(foundPath)) {
          visited.add(foundPath);
          queue.push(foundPath);
        }
      }
    }
    return dependencies;
  }

  async getTeamAgentIds(teamId) {
    const teamFilePath = path.join(this.stigmergyCore, "agent-teams", `${teamId}.yml`);
    const { content } = await this.parseFile(teamFilePath);
    const teamConfig = yaml.load(content);
    return teamConfig?.agents || [];
  }

  async listTeams() {
    const teamDir = path.join(this.stigmergyCore, "agent-teams");
    const files = await fs.readdir(teamDir);
    return files.filter((f) => f.endsWith(".yml")).map((f) => path.basename(f, ".yml"));
  }
}

module.exports = DependencyResolver;
