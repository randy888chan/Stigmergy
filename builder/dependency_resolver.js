const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");
const chalk = require("chalk");

class DependencyResolver {
  constructor(rootDir) {
    this.rootDir = rootDir;
    this.stigmergyCore = path.join(rootDir, ".stigmergy-core");
  }

  async resolveTeamDependencies(teamId) {
    const teamFilePath = path.join(this.stigmergyCore, "agent-teams", `${teamId}.yml`);
    if (!(await fs.pathExists(teamFilePath))) {
      throw new Error(`Team file not found: ${teamId}.yml`);
    }
    const teamFileContent = await fs.readFile(teamFilePath, "utf8");
    const teamConfig = yaml.load(teamFileContent);
    const agentIds = teamConfig?.agents || [];

    const allDependencies = new Map();
    const visited = new Set();

    for (const agentId of agentIds) {
      const agentPath = `agents/${agentId}.md`;
      await this.findDependenciesRecursive(agentPath, allDependencies, visited);
    }

    return allDependencies;
  }

  async findDependenciesRecursive(relativePath, allDependencies, visited) {
    if (visited.has(relativePath)) return;
    visited.add(relativePath);

    const fullPath = path.join(this.stigmergyCore, relativePath);
    if (!(await fs.pathExists(fullPath))) {
      // This warning is now only for legitimate, missing bundleable files.
      console.warn(chalk.yellow(`Warning: A required dependency was not found: ${relativePath}`));
      return;
    }

    const content = await fs.readFile(fullPath, "utf8");
    allDependencies.set(relativePath, content);

    // FINAL REGEX: Only looks for paths within specific, bundleable directories.
    const pathRegex = /[`'"]((templates|checklists|tasks)\/[\w-]+\.[\w]+)[`'"]/g;

    const promises = [];
    let match;
    while ((match = pathRegex.exec(content)) !== null) {
      const foundPath = path.normalize(match[1]);

      if (foundPath && !foundPath.startsWith("http")) {
        // Since paths are now guaranteed to be relative to the root, no complex joining is needed.
        promises.push(this.findDependenciesRecursive(foundPath, allDependencies, visited));
      }
    }

    await Promise.all(promises);
  }

  async listTeams() {
    const teamDir = path.join(this.stigmergyCore, "agent-teams");
    if (!(await fs.pathExists(teamDir))) return [];
    const files = await fs.readdir(teamDir);
    return files.filter((f) => f.endsWith(".yml")).map((f) => path.basename(f, ".yml"));
  }
}

module.exports = DependencyResolver;
