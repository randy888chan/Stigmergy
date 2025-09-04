#!/usr/bin/env node
/**
 * Stigmergy MCP Setup Script
 * 
 * This script sets up MCP server integration for any project to work with Roo Code.
 * It can be run from any project directory to enable Stigmergy coordination.
 */

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const stigmergyRoot = path.resolve(__dirname, '..');

async function setupMCPServer(targetDir = process.cwd()) {
  console.log(chalk.blue.bold('🔧 Stigmergy MCP Setup\n'));
  
  const projectName = path.basename(targetDir);
  console.log(`📁 Target project: ${chalk.cyan(projectName)}`);
  console.log(`📍 Location: ${chalk.gray(targetDir)}\n`);
  
  try {
    // Copy universal MCP server template
    const templatePath = path.join(stigmergyRoot, 'templates', 'mcp-server-universal.js');
    const targetMCPPath = path.join(targetDir, 'mcp-server.js');
    
    if (await fs.pathExists(targetMCPPath)) {
      console.log(chalk.yellow('⚠️  MCP server already exists. Backing up...'));
      await fs.move(targetMCPPath, `${targetMCPPath}.backup.${Date.now()}`);
    }
    
    await fs.copy(templatePath, targetMCPPath);
    await fs.chmod(targetMCPPath, '755'); // Make executable
    
    console.log(chalk.green('✅ Universal MCP server installed'));
    
    // Create package.json scripts if package.json exists
    const packageJsonPath = path.join(targetDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      
      if (!packageJson.scripts) {
        packageJson.scripts = {};
      }
      
      // Add Stigmergy-related scripts
      const scriptsToAdd = {
        "stigmergy:start": "cd . && node -p \"console.log('Starting Stigmergy for', require('path').basename(process.cwd()))\" && npm --prefix /Users/user/Documents/GitHub/Stigmergy run start",
        "stigmergy:stop": "pkill -f 'stigmergy'",
        "mcp:test": "echo 'Testing MCP server...' && node mcp-server.js"
      };
      
      let scriptsAdded = 0;
      for (const [script, command] of Object.entries(scriptsToAdd)) {
        if (!packageJson.scripts[script]) {
          packageJson.scripts[script] = command;
          scriptsAdded++;
        }
      }
      
      if (scriptsAdded > 0) {
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        console.log(chalk.green(`✅ Added ${scriptsAdded} npm scripts to package.json`));
      }
    }
    
    // Create .env.stigmergy.example if it doesn't exist
    const envStigmergyPath = path.join(targetDir, '.env.stigmergy.example');
    if (!(await fs.pathExists(envStigmergyPath))) {
      const envTemplate = `# Stigmergy Configuration for ${projectName}
# This file inherits from global Stigmergy configuration and can override specific settings

# Project-specific settings (optional)
# PROJECT_NAME=${projectName}
# PROJECT_TYPE=auto-detect

# Override AI providers if needed (optional)
# REASONING_PROVIDER=openrouter
# EXECUTION_PROVIDER=openrouter

# Custom agent behaviors (optional)
# ENABLE_AUTOMATIC_ENRICHMENT=true
# ENABLE_VALIDATION_PHASE=true
`;
      
      await fs.writeFile(envStigmergyPath, envTemplate);
      console.log(chalk.green('✅ Created .env.stigmergy.example'));
    }
    
    // Create README section for Stigmergy integration
    const readmePath = path.join(targetDir, 'README.md');
    let readmeUpdated = false;
    
    if (await fs.pathExists(readmePath)) {
      const readme = await fs.readFile(readmePath, 'utf8');
      const stigmergySection = `
## 🤖 Stigmergy Integration

This project is integrated with Stigmergy for AI-powered development coordination.

### Quick Start

1. **Start Stigmergy**: \`npm run stigmergy:start\`
2. **Use with Roo Code**: The MCP server (\`mcp-server.js\`) enables seamless integration
3. **Coordinate tasks**: Use natural language commands through Roo Code for project coordination

### Commands

- \`npm run stigmergy:start\` - Start Stigmergy for this project
- \`npm run stigmergy:stop\` - Stop Stigmergy processes
- \`npm run mcp:test\` - Test MCP server functionality

### Configuration

- Global settings: \`/Users/user/Documents/GitHub/Stigmergy/.env\`
- Project overrides: \`.env.stigmergy.example\` (copy to \`.env\` to activate)

The integration works universally without requiring project-specific modifications.
`;
      
      if (!readme.includes('Stigmergy Integration')) {
        await fs.writeFile(readmePath, readme + stigmergySection);
        readmeUpdated = true;
        console.log(chalk.green('✅ Updated README.md with Stigmergy integration info'));
      }
    }
    
    console.log(chalk.blue.bold('\n🎉 Setup Complete!\n'));
    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray('1.'), chalk.cyan('npm run stigmergy:start'), chalk.gray('- Start Stigmergy for this project'));
    console.log(chalk.gray('2.'), chalk.cyan('Configure Roo Code'), chalk.gray('- Point MCP server to'), chalk.white('./mcp-server.js'));
    console.log(chalk.gray('3.'), chalk.cyan('Start coordinating'), chalk.gray('- Use natural language commands in Roo Code'));
    
    console.log(chalk.blue('\n📋 Files created/updated:'));
    console.log(chalk.gray('•'), chalk.white('mcp-server.js'), chalk.gray('- Universal MCP server'));
    console.log(chalk.gray('•'), chalk.white('.env.stigmergy.example'), chalk.gray('- Project configuration template'));
    if (await fs.pathExists(packageJsonPath)) {
      console.log(chalk.gray('•'), chalk.white('package.json'), chalk.gray('- Added Stigmergy scripts'));
    }
    if (readmeUpdated) {
      console.log(chalk.gray('•'), chalk.white('README.md'), chalk.gray('- Added integration documentation'));
    }
    
    return {
      success: true,
      project: projectName,
      location: targetDir,
      mcp_server: targetMCPPath
    };
    
  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const targetDir = process.argv[2] || process.cwd();
  
  setupMCPServer(targetDir)
    .then(result => {
      if (result.success) {
        console.log(chalk.green('\n✨ Stigmergy MCP integration ready!'));
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error(chalk.red('❌ Setup script failed:'), error.message);
      process.exit(1);
    });
}

export { setupMCPServer };