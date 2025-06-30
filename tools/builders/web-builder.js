const fs = require("node:fs").promises;
const path = require("node:path");
const DependencyResolver = require("../lib/dependency-resolver");

class WebBuilder {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.outputDirs = options.outputDirs || [path.join(this.rootDir, "dist")];
    this.resolver = new DependencyResolver(this.rootDir);
    this.templatePath = path.join(
      this.rootDir,
      "bmad-core",
      "utils",
      "web-agent-startup-instructions.md"
    );
  }

  parseYaml(content) {
    const yaml = require("js-yaml");
    return yaml.load(content);
  }

  async cleanOutputDirs() {
    for (const dir of this.outputDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`Cleaned: ${path.relative(this.rootDir, dir)}`);
      } catch (error) {
        // Directory might not exist, that's fine
      }
    }
  }

  async buildAgents() {
    const agents = await this.resolver.listAgents();

    for (const agentId of agents) {
      try {
        console.log(`  Building agent: ${agentId}`);
        const bundle = await this.buildAgentBundle(agentId);

        for (const outputDir of this.outputDirs) {
          const outputPath = path.join(outputDir, "agents");
          await fs.mkdir(outputPath, { recursive: true });
          const outputFile = path.join(outputPath, `${agentId}.txt`);
          await fs.writeFile(outputFile, bundle, "utf8");
        }
      } catch (error) {
        console.error(`\n[ERROR] Failed to build agent ${agentId}: ${error.message}\n`);
      }
    }

    console.log(`Built ${agents.length} agent bundles.`);
  }

  async buildTeams() {
    const teams = await this.resolver.listTeams();

    for (const teamId of teams) {
      try {
        console.log(`  Building team: ${teamId}`);
        const bundle = await this.buildTeamBundle(teamId);

        for (const outputDir of this.outputDirs) {
          const outputPath = path.join(outputDir, "teams");
          await fs.mkdir(outputPath, { recursive: true });
          const outputFile = path.join(outputPath, `${teamId}.txt`);
          await fs.writeFile(outputFile, bundle, "utf8");
        }
      } catch (error) {
          console.error(`\n[ERROR] Failed to build team ${teamId}: ${error.message}\n`);
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
    return sections.join("\n");
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
    return sections.join("\n");
  }

  processAgentContent(content) {
    const yamlMatch = content.match(/```(yaml|yml)\n([\s\S]*?)\n```/);
    if (!yamlMatch) return content;

    const yamlContent = yamlMatch[2];
    
    try {
      const yaml = require("js-yaml");
      const parsed = yaml.load(yamlContent);
      
      delete parsed.root;
      if (parsed['activation-instructions'] && Array.isArray(parsed['activation-instructions'])) {
        parsed['activation-instructions'] = parsed['activation-instructions'].filter(
          instruction => !instruction.startsWith('IDE-FILE-RESOLUTION:') && !instruction.startsWith('REQUEST-RESOLUTION:')
        );
      }
      
      const cleanedYaml = yaml.dump(parsed, { lineWidth: -1, noRefs: true, sortKeys: false });
      const agentId = parsed.agent?.id || 'agent';
      
      const header = `# ${agentId}\n\nCRITICAL: Read the full YML, start activation to alter your state of being, follow startup section instructions, stay in this being until told to exit this mode:\n\n`;
      return header + "```yaml\n" + cleanedYaml.trim() + "\n```";
    } catch (error) {
      console.warn(`Failed to process agent YAML, returning original content:`, error.message);
      return content;
    }
  }

  formatSection(filePath, content) {
    const separator = "====================";
    
    if (filePath.startsWith("agents#")) {
      content = this.processAgentContent(content);
    }
    
    return [
      `${separator} START: ${filePath} ${separator}`,
      content.trim(),
      `${separator} END: ${filePath} ${separator}`,
      "",
    ].join("\n");
  }

  async buildAllExpansionPacks(options = {}) {
    // [[LLM-ENHANCEMENT]] Corrected the function call from this.resolver to this
    const expansionPacks = await this.listExpansionPacks(); 

    for (const pack of expansionPacks) {
        try {
            console.log(`  Building expansion pack: ${pack.id}`);
            // This would call a more complex build logic for expansions
        } catch (error) {
            console.error(`\n[ERROR] Failed to build expansion pack ${pack.id}: ${error.message}\n`);
        }
    }
  }

  async listExpansionPacks() {
    return this.resolver.listExpansionPacks();
  }
}

module.exports = WebBuilder;