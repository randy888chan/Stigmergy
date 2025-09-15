import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import coreBackup from "../../services/core_backup.js";
import { configureIde } from "./install_helpers.js";
import config from "../../stigmergy.config.js";
import chalk from "chalk";
import ora from "ora";
import { OutputFormatter } from "../utils/output_formatter.js";

async function findProjectRoot(startDir) {
    let currentDir = startDir;
    while (currentDir !== path.parse(currentDir).root) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            return currentDir;
        }
        currentDir = path.dirname(currentDir);
    }
    return null;
}

export async function install(options = {}) {
  OutputFormatter.section("Stigmergy Installation");
  
  const targetDir = process.cwd();
  
  // Handle MCP-only installation
  if (options.mcpOnly) {
    OutputFormatter.step(`Installing Stigmergy MCP server only into: ${targetDir}`);
    // Dynamically import to avoid circular dependencies
    const { setupMCPServer } = await import("../../scripts/setup-mcp.js");
    const result = await setupMCPServer(targetDir);
    
    if (result.success) {
      OutputFormatter.success("MCP server installation complete!");
      OutputFormatter.section("Next steps");
      OutputFormatter.list([
        "Start Stigmergy: 'npm run stigmergy:start'",
        "Configure your IDE MCP server to: ./mcp-server.js",
        "Use natural language commands through your IDE"
      ]);
    } else {
      OutputFormatter.error(`MCP server installation failed: ${result.error}`);
    }
    return result.success;
  }
  
  OutputFormatter.step(`Installing Stigmergy core into: ${targetDir}`);

  // Allow test suites to override the source core path
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sourceCoreDir = global.StigmergyConfig?.core_path || path.resolve(await findProjectRoot(__dirname), ".stigmergy-core");

  if (!sourceCoreDir || !(await fs.pathExists(sourceCoreDir))) {
      OutputFormatter.error(`Source .stigmergy-core not found at ${sourceCoreDir}. Cannot proceed.`);
      return false;
  }
  
  const targetCoreDir = path.join(targetDir, ".stigmergy-core");

  if (sourceCoreDir === targetCoreDir) {
    OutputFormatter.info("Running install in the project root. Skipping core file copy.");
  } else {
    if (await fs.pathExists(targetCoreDir)) {
        OutputFormatter.warning(".stigmergy-core already exists. Overwriting for a clean installation.");
        await fs.remove(targetCoreDir);
    }
    
    // Add progress indicator for file copying
    const copySpinner = ora({
      text: 'Copying core files',
      spinner: 'clock'
    }).start();
    
    try {
      await fs.copy(sourceCoreDir, targetCoreDir);
      copySpinner.succeed('Core files copied successfully');
    } catch (error) {
      copySpinner.fail('Failed to copy core files');
      throw error;
    }
  }

  // Add progress indicator for IDE configuration
  const ideSpinner = ora({
    text: 'Configuring IDE integration',
    spinner: 'clock'
  }).start();
  
  try {
    await configureIde(targetDir);
    ideSpinner.succeed('IDE integration configured');
  } catch (error) {
    ideSpinner.fail('Failed to configure IDE integration');
    throw error;
  }
  
  const projectRoot = await findProjectRoot(__dirname);
  if (projectRoot) {
      const sourceEnv = path.resolve(projectRoot, ".env.example");
      const targetEnv = path.join(targetDir, ".env.stigmergy.example");
      const fallbackTargetEnv = path.join(targetDir, ".env.example");
      
      // Add progress indicator for environment file copying
      const envSpinner = ora({
        text: 'Setting up environment configuration',
        spinner: 'clock'
      }).start();
      
      try {
        // Check if target already has .env.example, if so use .env.stigmergy.example
        if (await fs.pathExists(fallbackTargetEnv)) {
          await fs.copy(sourceEnv, targetEnv, { overwrite: false });
          envSpinner.succeed('.env.stigmergy.example created (preserving existing .env.example)');
        } else {
          await fs.copy(sourceEnv, fallbackTargetEnv, { overwrite: false });
          envSpinner.succeed('.env.example created');
        }
      } catch (error) {
        envSpinner.fail('Failed to set up environment configuration');
        throw error;
      }
  }

  // Add progress indicator for backup creation
  const backupSpinner = ora({
    text: 'Creating initial backup',
    spinner: 'clock'
  }).start();
  
  try {
    await coreBackup.autoBackup();
    backupSpinner.succeed('Initial backup created');
  } catch (error) {
    backupSpinner.fail('Failed to create initial backup');
    throw error;
  }
  
  // MCP Server Setup (if requested or by default)
  let mcpSetupSuccess = false;
  if (options.withMcp !== false) { // Default to true unless explicitly disabled
    const mcpSpinner = ora({
      text: 'Setting up MCP server integration',
      spinner: 'clock'
      }).start();
      
    try {
      // Dynamically import to avoid circular dependencies
      const { setupMCPServer } = await import("../../scripts/setup-mcp.js");
      const mcpResult = await setupMCPServer(targetDir);
      if (mcpResult.success) {
        mcpSetupSuccess = true;
        mcpSpinner.succeed('MCP server integration installed');
      } else {
        mcpSpinner.warn('MCP server setup skipped (non-critical)');
      }
    } catch (error) {
      mcpSpinner.fail(`MCP server setup failed: ${error.message}`);
    }
  }
  
  OutputFormatter.success("Stigmergy installation complete");
  
  OutputFormatter.section("What was installed");
  const installedItems = [
    "✅ .stigmergy-core/ - Agent definitions and templates",
    "✅ .roomodes - Roo Code agent configuration (@system agent)",
    "✅ .env example - Configuration template"
  ];
  
  if (mcpSetupSuccess) {
    installedItems.push(
      chalk.green("✅ mcp-server.js - Universal MCP server for IDE integration"),
      chalk.green("✅ npm scripts - Convenient Stigmergy commands")
    );
  }
  
  OutputFormatter.list(installedItems);

  OutputFormatter.section("Next steps");
  const nextSteps = [
    "Copy the appropriate .env example file to .env and add your API keys.",
    "Start Stigmergy: 'npm run stigmergy:start' (in Stigmergy directory)"
  ];
  
  if (mcpSetupSuccess) {
    nextSteps.push(
      chalk.cyan("3. 🔗 Configure MCP server in your IDE:"),
      chalk.gray("   • Roo Code: Point MCP server to ./mcp-server.js"),
      chalk.gray("   • Use natural language commands for project coordination"),
      "4. In Roo Code: '@system what can I do?' to get started"
    );
  } else {
    nextSteps.push(
      "3. 🔧 MANUAL: Configure MCP server in Roo Code settings (see docs/mcp-server-setup.md)",
      "4. In Roo Code: '@system what can I do?' to get started",
      chalk.yellow("\n💡 Tip: Run 'npx stigmergy mcp' to set up MCP integration later")
    );
  }
  
  OutputFormatter.list(nextSteps);
  
  OutputFormatter.success("Installation complete! Stigmergy is ready for universal project coordination.");
  return true;
}