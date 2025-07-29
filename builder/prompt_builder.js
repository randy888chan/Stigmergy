import fs from "fs-extra";
import path from "path";
import ora from "ora";
import chalk from "chalk";
import DependencyResolver from "./dependency_resolver.js";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

  formatSection(filePath, content) {
    const separator = "====================";
    const header = `START: ${filePath.replace(/\\/g, "/")}`;
    const footer = `END: ${filePath.replace(/\\/g, "/")}`;
    return [
      `${separator} ${header} ${separator}`,
      content.trim(),
      `${separator} ${footer} ${separator}`,
    ].join("\n");
  }

  async buildTeam(teamId) {
    const spinner = ora(`Building team bundle: ${chalk.cyan(teamId)}`).start();
    try {
      const allDependencies = await this.resolver.resolveTeamDependencies(teamId);

      if (allDependencies.size === 0) {
        spinner.warn(`No agents or dependencies found for team: ${chalk.cyan(teamId)}`);
        return;
      }

      spinner.text = `Found ${allDependencies.size} unique files. Bundling...`;
      const template = await fs.readFile(this.templatePath, "utf8");
      const sections = [template];

      for (const [relativePath, content] of allDependencies.entries()) {
        sections.push(this.formatSection(relativePath, content));
      }

      const bundle = sections.join("\n\n---\n\n");
      const outputFile = path.join(OUTPUT_DIR, "teams", `${teamId}.txt`);
      await fs.ensureDir(path.dirname(outputFile));
      await fs.writeFile(outputFile, bundle, "utf8");

      spinner.succeed(`Built team bundle: ${chalk.green(teamId)}`);
    } catch (error) {
      spinner.fail(`Failed to build team ${chalk.red(teamId)}`);
      console.error(error);
    }
  }

  async buildAllTeams() {
    const allTeamIds = await this.resolver.listTeams();
    for (const id of allTeamIds) {
      await this.buildTeam(id);
    }
  }
}

export async function runBuilder(options) {
  const builder = new PromptBuilder();
  await fs.rm(OUTPUT_DIR, { recursive: true, force: true }).catch(() => {});

  if (options.team) await builder.buildTeam(options.team);
  else if (options.all) await builder.buildAllTeams();
  else console.log(chalk.yellow("No build option specified. Use --team <id> or --all."));

  console.log(chalk.bold.green(`\nBuild complete. Output in ${chalk.cyan("dist/")}`));
}
