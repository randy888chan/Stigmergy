import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import coreBackup from "../../services/core_backup.js";
import { configureIde } from "./install_helpers.js";
import config from "../../stigmergy.config.js";
import { setupMCPServer } from "../../scripts/setup-mcp.js";
import chalk from "chalk";

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
  const targetDir = process.cwd();
  
  // Handle MCP-only installation
  if (options.mcpOnly) {
    console.log(chalk.blue(`🔧 Installing Stigmergy MCP server only into: ${targetDir}`));
    const result = await setupMCPServer(targetDir);
    
    if (result.success) {
      console.log(chalk.green("\n✅ MCP server installation complete!"));
      console.log(chalk.cyan("\n🎯 Next steps:"));
      console.log("1. Start Stigmergy: 'npm run stigmergy:start'");
      console.log("2. Configure your IDE MCP server to: ./mcp-server.js");
      console.log("3. Use natural language commands through your IDE");
    } else {
      console.error(chalk.red("❌ MCP server installation failed:"), result.error);
    }
    return result.success;
  }
  
  console.log(`Installing Stigmergy core into: ${targetDir}`);

  // Allow test suites to override the source core path
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const sourceCoreDir = global.StigmergyConfig?.core_path || path.resolve(await findProjectRoot(__dirname), ".stigmergy-core");

  if (!sourceCoreDir || !(await fs.pathExists(sourceCoreDir))) {
      console.error(`Source .stigmergy-core not found at ${sourceCoreDir}. Cannot proceed.`);
      return false;
  }
  
  const targetCoreDir = path.join(targetDir, ".stigmergy-core");

  if (sourceCoreDir === targetCoreDir) {
    console.log("Running install in the project root. Skipping core file copy.");
  } else {
    if (await fs.pathExists(targetCoreDir)) {
        console.log("⚠️ .stigmergy-core already exists. Overwriting for a clean installation.");
        await fs.remove(targetCoreDir);
    }
    await fs.copy(sourceCoreDir, targetCoreDir);
    console.log("✅ .stigmergy-core installed successfully.");
  }

  await configureIde(targetDir);
  
  const projectRoot = await findProjectRoot(__dirname);
  if (projectRoot) {
      const sourceEnv = path.resolve(projectRoot, ".env.example");
      const targetEnv = path.join(targetDir, ".env.stigmergy.example");
      const fallbackTargetEnv = path.join(targetDir, ".env.example");
      
      // Check if target already has .env.example, if so use .env.stigmergy.example
      if (await fs.pathExists(fallbackTargetEnv)) {
        await fs.copy(sourceEnv, targetEnv, { overwrite: false });
        console.log("✅ .env.stigmergy.example created (preserving existing .env.example).");
        console.log("💡 Copy .env.stigmergy.example to .env and configure your API keys.");
      } else {
        await fs.copy(sourceEnv, fallbackTargetEnv, { overwrite: false });
        console.log("✅ .env.example created.");
      }
  }

  await coreBackup.autoBackup();
  console.log("✅ Initial backup of new core created.");
  
  // MCP Server Setup (if requested or by default)
  let mcpSetupSuccess = false;
  if (options.withMcp !== false) { // Default to true unless explicitly disabled
    console.log(chalk.blue("\n🔗 Setting up MCP server integration..."));
    try {
      const mcpResult = await setupMCPServer(targetDir);
      if (mcpResult.success) {
        mcpSetupSuccess = true;
        console.log(chalk.green("✅ MCP server integration installed"));
      } else {
        console.log(chalk.yellow("⚠️ MCP server setup skipped (non-critical)"));
      }
    } catch (error) {
      console.log(chalk.yellow(`⚠️ MCP server setup failed: ${error.message}`));
    }
  }
  
  console.log("\n🚀 Stigmergy installation complete.");
  console.log("\n📋 What was installed:");
  console.log("   ✅ .stigmergy-core/ - Agent definitions and templates");
  console.log("   ✅ .roomodes - Roo Code agent configuration (@system agent)");
  console.log("   ✅ .env example - Configuration template");
  if (mcpSetupSuccess) {
    console.log(chalk.green("   ✅ mcp-server.js - Universal MCP server for IDE integration"));
    console.log(chalk.green("   ✅ npm scripts - Convenient Stigmergy commands"));
  }
  
  console.log("\n🎯 Next steps:");
  console.log("1. Copy the appropriate .env example file to .env and add your API keys.");
  console.log("2. Start Stigmergy: 'npm run stigmergy:start' (in Stigmergy directory)");
  
  if (mcpSetupSuccess) {
    console.log(chalk.cyan("3. 🔗 Configure MCP server in your IDE:"));
    console.log(chalk.gray("   • Roo Code: Point MCP server to ./mcp-server.js"));
    console.log(chalk.gray("   • Use natural language commands for project coordination"));
    console.log("4. In Roo Code: '@system what can I do?' to get started");
  } else {
    console.log("3. 🔧 MANUAL: Configure MCP server in Roo Code settings (see docs/mcp-server-setup.md)");
    console.log("4. In Roo Code: '@system what can I do?' to get started");
    console.log(chalk.yellow("\n💡 Tip: Run 'npx stigmergy mcp' to set up MCP integration later"));
  }
  
  console.log("\n✨ Installation complete! Stigmergy is ready for universal project coordination.");
  return true;
}
