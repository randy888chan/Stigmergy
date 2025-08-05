#!/usr/bin/env node

import { Command } from "commander";
// --- FIX: Use fs.readFileSync to import JSON for broader compatibility ---
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
// --------------------------------------------------------------------
import { run as runInstaller } from "../installer/install.js";
import { main as startEngine } from "../engine/server.js";
import { runBuilder } from "../builder/prompt_builder.js";
import open from "open";
import inquirer from "inquirer";
import fs from "fs-extra";
import path from "path";

const program = new Command();

program
  .name("stigmergy")
  .description("The command-line interface for the Stigmergy Autonomous Development System.")
  .version(pkg.version);

program
  .command("install")
  .description("Installs the Stigmergy knowledge base and configures your IDE.")
  .action(async () => {
    await runInstaller();
  });

program
  .command("build")
  .description("Builds self-contained prompt bundles for use in portable Web UIs (e.g., Gemini).") // <-- MODIFIED DESCRIPTION
  .option(
    "-t, --team <teamId>",
    "Build a bundle for a specific agent team (defaults to 'team-web-planners')."
  ) // <-- MODIFIED DESCRIPTION
  .option("--all", "Build all available agent teams.")
  .action(async (options) => {
    // --- IMPROVEMENT: Default to the new web-planners team ---
    if (!options.team && !options.all) {
      options.team = "team-web-planners";
    }
    // ---------------------------------------------------------
    await runBuilder(options);
  });

program
  .command("start")
  .description("Starts the Stigmergy engine server.")
  .action(async () => {
    await startEngine();
  });

program
  .command("dashboard")
  .description("Open state visualization dashboard")
  .action(() => {
    import("../dashboard/server.js");
    open("http://localhost:8080");
  });

program
  .command("config-wizard")
  .description("Run an interactive wizard to configure Stigmergy for your project.")
  .action(async () => {
    console.log("Welcome to the Stigmergy Configuration Wizard!");
    console.log("This will help you set up your .env and stigmergy.config.js files.");

    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is your project's name?",
        default: path.basename(process.cwd()),
      },
      {
        type: "list",
        name: "aiProvider",
        message: "Which AI provider will you use?",
        choices: ["OpenAI", "Anthropic", "Google", "Fireworks", "Other"],
      },
      {
        type: "input",
        name: "apiKey",
        message: (answers) => `Enter your ${answers.aiProvider} API key:`,
        when: (answers) => answers.aiProvider !== "Other",
      },
      {
        type: "input",
        name: "model",
        message: "Which specific model will you use (e.g., gpt-4-turbo, claude-3-opus-20240229)?",
        when: (answers) => answers.aiProvider !== "Other",
      },
      {
        type: "confirm",
        name: "useNeo4j",
        message: "Do you want to enable Neo4j for code intelligence (recommended)?",
        default: true,
      },
      {
        type: "input",
        name: "neo4jUri",
        message: "Enter your Neo4j URI:",
        default: "neo4j://localhost:7687",
        when: (answers) => answers.useNeo4j,
      },
      {
        type: "input",
        name: "neo4jUser",
        message: "Enter your Neo4j username:",
        default: "neo4j",
        when: (answers) => answers.useNeo4j,
      },
      {
        type: "password",
        name: "neo4jPassword",
        message: "Enter your Neo4j password:",
        mask: "*",
        when: (answers) => answers.useNeo4j,
      },
    ]);

    // --- Generate .env file content ---
    let envContent = `# Stigmergy Environment Configuration\n`;
    envContent += `AI_PROVIDER=${answers.aiProvider.toLowerCase()}\n`;
    if (answers.apiKey) {
      envContent += `AI_API_KEY=${answers.apiKey}\n`;
    }
    if (answers.model) {
      envContent += `AI_MODEL=${answers.model}\n`;
    }
    if (answers.useNeo4j) {
      envContent += `\n# Neo4j Connection Details\n`;
      envContent += `NEO4J_URI=${answers.neo4jUri}\n`;
      envContent += `NEO4J_USER=${answers.neo4jUser}\n`;
      envContent += `NEO4J_PASSWORD=${answers.neo4jPassword}\n`;
    }

    // --- Generate stigmergy.config.js content ---
    const configContent = `
// Stigmergy Configuration File
export default {
  project_name: "${answers.projectName}",
  features: {
    // Neo4j feature can be 'required', 'auto', 'memory', or false
    neo4j: ${answers.useNeo4j ? "'auto'" : "false"},
  },
  // Add other project-specific configurations here
};
`;

    // --- Write files ---
    const envPath = path.join(process.cwd(), ".env");
    const configPath = path.join(process.cwd(), "stigmergy.config.js");

    await fs.writeFile(envPath, envContent);
    console.log(`✅ Successfully created ${envPath}`);

    await fs.writeFile(configPath, configContent.trim());
    console.log(`✅ Successfully created ${configPath}`);

    console.log("\nConfiguration complete! You can now run 'stigmergy start'.");
  });

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("Command failed:", err);
  process.exit(1);
});
