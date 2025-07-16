const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");
const { marked } = require("marked");

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, ".stigmergy-core");
  }

  async parseFile(filePath) {
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    return fs.readFile(filePath, "utf8");
  }

  async resolveDependencies(initialRelativePath) {
    const visited = new Set();
    const dependencies = new Map();
    const queue = [initialRelativePath];
    
    visited.add(initialRelativePath);

    while (queue.length > 0) {
      const currentPath = queue.shift();
      const fullPath = path.join(this.stigmergyCore, currentPath);
      
      if (!await fs.pathExists(fullPath)) {
        console.warn(chalk.yellow(`Warning: Dependency not found, skipping: ${currentPath}`));
        continue;
      }
      const content = await this.parseFile(fullPath);
      dependencies.set(currentPath, content);

      const pathRegex = /[`'"](\.\/|[\w-]+(?:\/[\w-]+)+\.(?:md|yml|yaml|json))[`'"]/g;
      
      let match;
      while ((match = pathRegex.exec(content)) !== null) {
        const foundPath = path.normalize(match[1]); 
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
    const content = await this.parseFile(teamFilePath);
    const teamConfig = yaml.load(content);
    return teamConfig?.agents || [];
  }

  async listTeams() {
    const teamDir = path.join(this.stigmergyCore, "agent-teams");
    if (!(await fs.pathExists(teamDir))) return [];
    const files = await fs.readdir(teamDir);
    return files.filter((f) => f.endsWith(".yml")).map((f) => path.basename(f, ".yml"));
  }
}

module.exports = DependencyResolver;
