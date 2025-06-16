const fs = require('node:fs').promises;
const path = require('node:path');
const DependencyResolver = require('../lib/dependency-resolver');

class WebBuilder {
  constructor(options = {}) {
    this.rootDir = options.rootDir || process.cwd();
    this.outputDirs = options.outputDirs || [
      path.join(this.rootDir, 'dist'),
      path.join(this.rootDir, '.bmad-core', 'web-bundles')
    ];
    this.resolver = new DependencyResolver(this.rootDir);
    this.templatePath = path.join(this.rootDir, '.bmad-core', 'templates', 'web-agent-startup-instructions-template.md');
  }

  async cleanOutputDirs() {
    for (const dir of this.outputDirs) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
        console.log(`Cleaned: ${path.relative(this.rootDir, dir)}`);
      } catch (error) {
        console.debug(`Failed to clean directory ${dir}:`, error.message);
        // Directory might not exist, that's fine
      }
    }
  }

  async buildAgents() {
    const agents = await this.resolver.listAgents();

    for (const agentId of agents) {
      console.log(`  Building agent: ${agentId}`);
      const bundle = await this.buildAgentBundle(agentId);

      // Write to all output directories
      for (const outputDir of this.outputDirs) {
        const outputPath = path.join(outputDir, 'agents');
        await fs.mkdir(outputPath, { recursive: true });
        const outputFile = path.join(outputPath, `${agentId}.txt`);
        await fs.writeFile(outputFile, bundle, 'utf8');
      }
    }

    console.log(`Built ${agents.length} agent bundles in ${this.outputDirs.length} locations`);
  }

  async buildTeams() {
    const teams = await this.resolver.listTeams();

    for (const teamId of teams) {
      console.log(`  Building team: ${teamId}`);
      const bundle = await this.buildTeamBundle(teamId);

      // Write to all output directories
      for (const outputDir of this.outputDirs) {
        const outputPath = path.join(outputDir, 'teams');
        await fs.mkdir(outputPath, { recursive: true });
        const outputFile = path.join(outputPath, `${teamId}.txt`);
        await fs.writeFile(outputFile, bundle, 'utf8');
      }
    }

    console.log(`Built ${teams.length} team bundles in ${this.outputDirs.length} locations`);
  }

  async buildAgentBundle(agentId) {
    const dependencies = await this.resolver.resolveAgentDependencies(agentId);
    const template = await fs.readFile(this.templatePath, 'utf8');

    const sections = [template];

    // Add agent configuration
    sections.push(this.formatSection(dependencies.agent.path, dependencies.agent.content));

    // Add all dependencies
    for (const resource of dependencies.resources) {
      sections.push(this.formatSection(resource.path, resource.content));
    }

    return sections.join('\n');
  }

  async buildTeamBundle(teamId) {
    const dependencies = await this.resolver.resolveTeamDependencies(teamId);
    const template = await fs.readFile(this.templatePath, 'utf8');

    const sections = [template];

    // Add team configuration
    sections.push(this.formatSection(dependencies.team.path, dependencies.team.content));

    // Add all agents
    for (const agent of dependencies.agents) {
      sections.push(this.formatSection(agent.path, agent.content));
    }

    // Add all deduplicated resources
    for (const resource of dependencies.resources) {
      sections.push(this.formatSection(resource.path, resource.content));
    }

    return sections.join('\n');
  }

  formatSection(path, content) {
    const separator = '====================';
    return [
      `${separator} START: ${path} ${separator}`,
      content.trim(),
      `${separator} END: ${path} ${separator}`,
      ''
    ].join('\n');
  }

  async validate() {
    console.log('Validating agent configurations...');
    const agents = await this.resolver.listAgents();
    for (const agentId of agents) {
      try {
        await this.resolver.resolveAgentDependencies(agentId);
        console.log(`  ✓ ${agentId}`);
      } catch (error) {
        console.log(`  ✗ ${agentId}: ${error.message}`);
        throw error;
      }
    }

    console.log('\nValidating team configurations...');
    const teams = await this.resolver.listTeams();
    for (const teamId of teams) {
      try {
        await this.resolver.resolveTeamDependencies(teamId);
        console.log(`  ✓ ${teamId}`);
      } catch (error) {
        console.log(`  ✗ ${teamId}: ${error.message}`);
        throw error;
      }
    }
  }

  async buildAllExpansionPacks(options = {}) {
    const expansionPacks = await this.listExpansionPacks();

    for (const packName of expansionPacks) {
      console.log(`  Building expansion pack: ${packName}`);
      await this.buildExpansionPack(packName, options);
    }

    console.log(`Built ${expansionPacks.length} expansion pack bundles`);
  }

  async buildExpansionPack(packName, options = {}) {
    const packDir = path.join(this.rootDir, 'expansion-packs', packName);
    const outputDir = path.join(packDir, 'web-bundles');

    // Clean output directory if requested
    if (options.clean !== false) {
      try {
        await fs.rm(outputDir, { recursive: true, force: true });
      } catch (error) {
        // Directory might not exist, that's fine
      }
    }

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Check for team configuration
    const teamConfigPath = path.join(packDir, `team-${packName}.yml`);
    try {
      await fs.access(teamConfigPath);
      
      // Build expansion pack as a team bundle
      const bundle = await this.buildExpansionTeamBundle(packName, packDir);
      const outputFile = path.join(outputDir, `team-${packName}.txt`);
      await fs.writeFile(outputFile, bundle, 'utf8');
      
      console.log(`    ✓ Created bundle: ${path.relative(this.rootDir, outputFile)}`);
    } catch (error) {
      console.warn(`    ⚠ No team configuration found for ${packName}, skipping...`);
    }
  }

  async buildExpansionTeamBundle(packName, packDir) {
    const teamConfigPath = path.join(packDir, `team-${packName}.yml`);
    const template = await fs.readFile(this.templatePath, 'utf8');

    const sections = [template];

    // Add team configuration
    const teamContent = await fs.readFile(teamConfigPath, 'utf8');
    sections.push(this.formatSection(`agent-teams#team-${packName}`, teamContent));

    // Add bmad-orchestrator (required for all teams)
    const orchestratorPath = path.join(this.rootDir, '.bmad-core', 'agents', 'bmad-orchestrator.md');
    const orchestratorContent = await fs.readFile(orchestratorPath, 'utf8');
    sections.push(this.formatSection('agents#bmad-orchestrator', orchestratorContent));

    // Add expansion pack agents
    const agentsDir = path.join(packDir, 'agents');
    try {
      const agentFiles = await fs.readdir(agentsDir);
      for (const agentFile of agentFiles.filter(f => f.endsWith('.md'))) {
        const agentPath = path.join(agentsDir, agentFile);
        const agentContent = await fs.readFile(agentPath, 'utf8');
        const agentName = agentFile.replace('.md', '');
        sections.push(this.formatSection(`agents#${agentName}`, agentContent));
      }
    } catch (error) {
      console.warn(`    ⚠ No agents directory found in ${packName}`);
    }

    // Add expansion pack resources (templates, tasks, checklists)
    const resourceDirs = ['templates', 'tasks', 'checklists', 'workflows', 'data'];
    for (const resourceDir of resourceDirs) {
      const resourcePath = path.join(packDir, resourceDir);
      try {
        const resourceFiles = await fs.readdir(resourcePath);
        for (const resourceFile of resourceFiles.filter(f => f.endsWith('.md') || f.endsWith('.yml'))) {
          const filePath = path.join(resourcePath, resourceFile);
          const fileContent = await fs.readFile(filePath, 'utf8');
          const fileName = resourceFile.replace(/\.(md|yml)$/, '');
          sections.push(this.formatSection(`${resourceDir}#${fileName}`, fileContent));
        }
      } catch (error) {
        // Directory might not exist, that's fine
      }
    }

    return sections.join('\n');
  }

  async listExpansionPacks() {
    const expansionPacksDir = path.join(this.rootDir, 'expansion-packs');
    try {
      const entries = await fs.readdir(expansionPacksDir, { withFileTypes: true });
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => entry.name);
    } catch (error) {
      console.warn('No expansion-packs directory found');
      return [];
    }
  }

  listAgents() {
    return this.resolver.listAgents();
  }
}

module.exports = WebBuilder;