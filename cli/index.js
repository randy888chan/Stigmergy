#!/usr/bin/env node

import { Command } from "commander";
// --- FIX: Use fs.readFileSync to import JSON for broader compatibility ---
import { readFileSync } from "fs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");
// --------------------------------------------------------------------
import { run as runInstaller } from "../installer/install.js";
import { runBuilder } from "../builder/prompt_builder.js";

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

async function main() {
  await program.parseAsync(process.argv);
}

main().catch((err) => {
  console.error("Command failed:", err);
  process.exit(1);
});
