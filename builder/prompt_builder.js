const fs = require('fs-extra');
const path = require('path');
const ora = require('ora');
const chalk = require('chalk');
const DependencyResolver = require('./dependency_resolver');

const ROOT_DIR = path.join(__dirname, '..');
const OUTPUT_DIR = path.join(process.cwd(), 'dist');

class PromptBuilder {
  constructor() {
    this.resolver = new DependencyResolver(ROOT_DIR);
    this.templatePath = path.join(ROOT_DIR, '.stigmergy-core', 'utils', 'web-agent-startup-instructions.md');
  }

  async cleanOutput() {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  }

  formatSection(filePath, content) {
    const separator = "====================";
    const header = `START: ${filePath.replace(/\\/g, '/')}`; // Normalize path separators
    const footer = `END: ${filePath.replace(/\\/g, '/')}`;
    return [`${separator} ${header} ${separator}`, content.trim(), `${separator} ${footer} ${separator}`].join("\n");
  }

  async buildAgent(agentId) {
    const spinner = ora(`Building agent bundle: ${chalk.cyan(agentId)}`).start();
    try {
      const dependencies = await this.resolver.resolveAgentDependencies(agentId);
      const template = await fs.readFile(this.templatePath, "utf8");
      
      const sections = [template];
      // Add agent file itself
      const agentRelativePath = path.relative(path.join(ROOT_DIR, '.stigmergy-core'), dependencies.agent.path);
      sections.push(this.formatSection(agentRelativePath, dependencies.agent.content));

      // Add resource files
      for (const resource of dependencies.resources) {
        const resourceRelativePath = path.relative(path.join(ROOT_DIR, '.stigmergy-core'), resource.path);
        sections.push(this.formatSection(resourceRelativePath, resource.content));
      }

      const bundle = sections.join("\n\n---\n\n");
      const outputFile = path.join(OUTPUT_DIR, 'agents', `${agentId}.txt`);
      await fs.ensureDir(path.dirname(outputFile));
      await fs.writeFile(outputFile, bundle, 'utf8');

      spinner.succeed(`Built agent bundle: ${chalk.green(agentId)}`);
    } catch (error) {
      spinner.fail(`Failed to build agent ${chalk.red(agentId)}: ${error.message}`);
    }
  }
  
  async buildAllAgents() {
    const allAgentIds = await this.resolver.listAgents();
    console.log(chalk.bold(`\nBuilding all ${allAgentIds.length} agents...`));
    for (const id of allAgentIds) {
      await this.buildAgent(id);
    }
  }
}

async function runBuilder(options) {
  const builder = new PromptBuilder();
  await builder.cleanOutput();

  if (options.agent) {
    await builder.buildAgent(options.agent);
  } else if (options.team) {
    // Team building logic can be added here in the future
    console.log(chalk.yellow('Team building is not yet implemented in this version.'));
  } else if (options.all) {
    await builder.buildAllAgents();
  } else {
    console.log(chalk.yellow('No build option specified. Use --agent <id> or --all.'));
    console.log('Example: npx stigmergy build --agent mary');
  }
  console.log(chalk.bold.green('\nPrompt building process complete.'));
  console.log(`Output files are in the ${chalk.cyan('dist/')} directory.`);
}

module.exports = { runBuilder };
