const fs = require("node:fs").promises;
const path = require("node:path");
const DependencyResolver = require("../lib/dependency-resolver");

class WebBuilder {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.outputDir = path.join(this.rootDir, "dist");
    this.resolver = new DependencyResolver(this.rootDir);
    this.templatePath = path.join(
      this.rootDir,
      "bmad-core",
      "utils",
      "web-agent-startup-instructions.md"
    );
  }

  async cleanOutputDirs() {
    await fs.rm(this.outputDir, { recursive: true, force: true });
    console.log(`Cleaned: ${path.relative(this.rootDir, this.outputDir)}`);
  }

  async buildAgents() {
    const agents = await this.resolver.listAgents();
    const outputPath = path.join(this.outputDir, "agents");
    await fs.mkdir(outputPath, { recursive: true });

    for (const agentId of agents) {
      try {
        console.log(`  Building agent bundle: ${agentId}`);
        const bundle = await this.buildAgentBundle(agentId);
        const outputFile = path.join(outputPath, `${agentId}.txt`);
        await fs.writeFile(outputFile, bundle, "utf8");
      } catch (error) {
        console.error(`\n[ERROR] Failed to build agent ${agentId}: ${error.message}`);
      }
    }
    console.log(`Built ${agents.length} agent bundles.`);
  }

  async buildTeams() {
    const teams = await this.resolver.listTeams();
    const outputPath = path.join(this.outputDir, "teams");
    await fs.mkdir(outputPath, { recursive: true });

    for (const teamId of teams) {
      try {
        console.log(`  Building team bundle: ${teamId}`);
        const bundle = await this.buildTeamBundle(teamId);
        const outputFile = path.join(outputPath, `${teamId}.txt`);
        await fs.writeFile(outputFile, bundle, "utf8");
      } catch (error) {
          console.error(`\n[ERROR] Failed to build team ${teamId}: ${error.message}`);
      }
    }
    console.log(`Built ${teams.length} team bundles.`);
  }

  async buildAgentBundle(agentId) {
    const dependencies = await this.resolver.resolveAgentDependencies(agentId);
    const template = await fs.readFile(this.templatePath, "utf8");
    const sections = [template, this.formatSection(dependencies.agent.path, dependencies.agent.content)];
    for (const resource of dependencies.resources) {
      sections.push(this.formatSection(resource.path, resource.content));
    }
    return sections.join("\n\n");
  }

  async buildTeamBundle(teamId) {
    const dependencies = await this.resolver.resolveTeamDependencies(teamId);
    const template = await fs.readFile(this.templatePath, "utf8");
    const sections = [template, this.formatSection(dependencies.team.path, dependencies.team.content)];
    
    for (const agent of dependencies.agents) {
      sections.push(this.formatSection(agent.path, agent.content));
    }
    for (const resource of dependencies.resources) {
      sections.push(this.formatSection(resource.path, resource.content));
    }
    return sections.join("\n\n");
  }

  formatSection(filePath, content) {
    const separator = "====================";
    const header = `START: ${filePath}`;
    const footer = `END: ${filePath}`;
    
    return [
      `${separator} ${header} ${separator}`,
      content.trim(),
      `${separator} ${footer} ${separator}`,
    ].join("\n");
  }
}

module.exports = WebBuilder;
