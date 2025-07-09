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
      ".stigmergy-core",
      "utils",
      "web-agent-startup-instructions.md"
    );
  }

  async cleanOutputDirs() {
    await fs.rm(this.outputDir, { recursive: true, force: true });
    console.log(`Cleaned: ${path.relative(this.rootDir, this.outputDir)}`);
  }

  async buildAgents(agentId = null) {
    let allAgentIds = await this.resolver.listAgents();
    let agentsToBuild = allAgentIds;

    if (agentId) {
      if (!allAgentIds.includes(agentId)) {
        throw new Error(`Agent with ID '${agentId}' not found. Available agents: ${allAgentIds.join(', ')}`);
      }
      agentsToBuild = [agentId];
      console.log(`Building single agent bundle: ${agentId}`);
    } else {
      console.log('Building all agent bundles...');
    }
    
    const outputPath = path.join(this.outputDir, "agents");
    await fs.mkdir(outputPath, { recursive: true });

    for (const id of agentsToBuild) {
      try {
        console.log(`  Building: ${id}`);
        const bundle = await this.buildAgentBundle(id);
        const outputFile = path.join(outputPath, `${id}.txt`);
        await fs.writeFile(outputFile, bundle, "utf8");
      } catch (error) {
        console.error(`\n[ERROR] Failed to build agent ${id}: ${error.message}`);
      }
    }
    console.log(`Built ${agentsToBuild.length} agent bundle(s).`);
  }

  async buildTeams() {
    const teams = await this.resolver.listTeams();
    const outputPath = path.join(this.outputDir, "teams");
    await fs.mkdir(outputPath, { recursive: true });

    console.log('Building team bundles...');
    for (const teamId of teams) {
      try {
        console.log(`  Building: ${teamId}`);
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
