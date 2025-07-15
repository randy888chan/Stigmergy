const fs = require("fs-extra");
const path = require("path");
const ora = require("ora");
const chalk = require("chalk");
const yaml = require("js-yaml");
const DependencyResolver = require("./dependency_resolver");

const ROOT_DIR = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(process.cwd(), "dist");

class PromptBuilder {
  constructor() {
    this.resolver = new DependencyResolver(ROOT_DIR);
    this.templatePath = path.join(
      ROOT_DIR,
      ".stigmergy-core",
      "utils",
      "web-agent-startup-instructions.md"
    );
  }

  async cleanOutput() {
    await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
  }

  formatSection(filePath, content) {
    const separator = "====================";
    const header = `START: ${filePath.replace(/\\/g, "/")}`;
    const footer = `END: ${filePath.replace(/\\/g, "/")}`;
    return [`${separator} ${header} ${separator}`, content.trim(), `${separator} ${footer} ${separator}`].join(
      "\n"
    );
  }

  async buildTeam(teamId) {
    const spinner = ora(`Building team bundle: ${chalk.cyan(teamId)}`).start();
    try {
      const teamFilePath = path.join(ROOT_DIR, ".stigmergy-core", "agent-teams", `${teamId}.yml`);
      if (!(await fs.pathExists(teamFilePath))) {
        throw new Error(`Team file not found: ${teamId}.yml`);
      }

      const teamFileContent = await fs.readFile(teamFilePath, "utf8");
      const teamConfig = yaml.load(teamFileContent);
      const agentIds = teamConfig?.agents || [];

      if (agentIds.length === 0) {
        spinner.warn(`No agents found in team: ${chalk.cyan(teamId)}`);
        return;
      }

      spinner.text = `Found ${agentIds.length} agents in ${chalk.cyan(
        teamId
      )}. Resolving dependencies...`;

      const allResources = new Map();
      for (const agentId of agentIds) {
        const deps = await this.resolver.resolveAgentDependencies(agentId);
        const agentRelPath = path.relative(this.resolver.stigmergyCore, deps.agent.path);

        // Add agent itself
        if (!allResources.has(agentRelPath)) {
          allResources.set(agentRelPath, deps.agent.content);
        }

        // Add its resources
        for (const resource of deps.resources) {
          if (!allResources.has(resource.relativePath)) {
            allResources.set(resource.relativePath, resource.content);
          }
        }
      }

      spinner.text = `Found ${allResources.size} unique files for team ${chalk.cyan(
        teamId
      )}. Bundling...`;

      const template = await fs.readFile(this.templatePath, "utf8");
      const sections = [template];

      for (const [relativePath, content] of allResources.entries()) {
        sections.push(this.formatSection(relativePath, content));
      }

      const bundle = sections.join("\n\n---\n\n");
      const outputFile = path.join(OUTPUT_DIR, "teams", `${teamId}.txt`);
      await fs.ensureDir(path.dirname(outputFile));
      await fs.writeFile(outputFile, bundle, "utf8");

      spinner.succeed(`Built team bundle: ${chalk.green(teamId)}`);
    } catch (error) {
      spinner.fail(`Failed to build team ${chalk.red(teamId)}: ${error.message}`);
      console.error(error);
    }
  }

  async buildAllTeams() {
    const allTeamIds = await this.resolver.listTeams();
    console.log(chalk.bold(`\nBuilding all ${allTeamIds.length} teams...`));
    for (const id of allTeamIds) {
      await this.buildTeam(id);
    }
  }
}

async function runBuilder(options) {
  const builder = new PromptBuilder();
  await builder.cleanOutput();

  if (options.team) {
    await builder.buildTeam(options.team);
  } else if (options.all) {
    await builder.buildAllTeams();
  } else {
    console.log(chalk.yellow("No build option specified. Use --team <id> or --all."));
    console.log("Example: npx stigmergy build --team team-planning-crew");
  }
  console.log(chalk.bold.green("\nPrompt building process complete."));
  console.log(`Output files are in the ${chalk.cyan("dist/")} directory.`);
}

module.exports = { runBuilder };
