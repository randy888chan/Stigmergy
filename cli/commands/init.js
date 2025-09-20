import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import config from "../../stigmergy.config.js";
import chalk from "chalk";
import ora from "ora";
import { OutputFormatter } from "../utils/output_formatter.js";
import inquirer from "inquirer";

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

export async function init(options = {}) {
  OutputFormatter.section("Stigmergy Initialization");
  
  const targetDir = process.cwd();
  
  OutputFormatter.step(`Initializing Stigmergy in: ${targetDir}`);

  // Create .stigmergy directory in the target project
  const stigmergyDir = path.join(targetDir, ".stigmergy");
  await fs.ensureDir(stigmergyDir);
  
  // Create default configuration file
  const configPath = path.join(stigmergyDir, "config.js");
  if (!await fs.pathExists(configPath)) {
    const defaultConfig = `// Stigmergy Project Configuration
import path from "path";

export default {
  projectName: path.basename(process.cwd()),
  features: {
    neo4j: "auto", // Options: 'required', 'auto', 'memory'
    automation_mode: "autonomous", // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: true,
    deepcode_integration: true,
  },
  // Add your project-specific configuration here
};`;
    await fs.writeFile(configPath, defaultConfig);
    OutputFormatter.success("Created default configuration file");
  }

  // Create .env.stigmergy.example file
  const envExamplePath = path.join(stigmergyDir, ".env.stigmergy.example");
  const sourceEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.example');
  if (await fs.pathExists(sourceEnv) && !await fs.pathExists(envExamplePath)) {
    await fs.copy(sourceEnv, envExamplePath);
    OutputFormatter.success("Created environment example file");
  }

  // Create directories for trajectories, state, logs, and traces
  await fs.ensureDir(path.join(stigmergyDir, "trajectories"));
  await fs.ensureDir(path.join(stigmergyDir, "state"));
  await fs.ensureDir(path.join(stigmergyDir, "logs"));
  await fs.ensureDir(path.join(stigmergyDir, "traces"));
  
  // Ask user if they want to configure API keys now
  if (options.interactive !== false) {  // Only ask if not explicitly non-interactive
    const { configureKeys } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configureKeys',
        message: 'Would you like to configure your API keys now?',
        default: true
      }
    ]);
    
    if (configureKeys) {
      // Read the .env.stigmergy.example file
      if (await fs.pathExists(envExamplePath)) {
        const envExampleContent = await fs.readFile(envExamplePath, 'utf8');
        const keyLines = envExampleContent.split('\n').filter(line => line.includes('_KEY='));
        
        // Create .env file
        const envPath = path.join(stigmergyDir, ".env");
        let envContent = '';
        
        // Process each key
        for (const line of keyLines) {
          const keyName = line.split('=')[0];
          let link = 'provider website';
          
          // Provide specific links for known providers
          if (keyName === 'GOOGLE_API_KEY') {
            link = 'https://ai.google.dev/';
          } else if (keyName === 'GITHUB_TOKEN') {
            link = 'https://github.com/settings/tokens';
          } else if (keyName === 'OPENROUTER_API_KEY') {
            link = 'https://openrouter.ai/';
          }
          
          const { keyValue } = await inquirer.prompt([
            {
              type: 'input',
              name: 'keyValue',
              message: `Please enter your ${keyName} (you can get one at ${link}):`
            }
          ]);
          
          envContent += `${keyName}=${keyValue}\n`;
        }
        
        // Write the .env file
        await fs.writeFile(envPath, envContent);
        OutputFormatter.success("API keys configured successfully");
      }
    }
  }
  
  OutputFormatter.success("Stigmergy project initialization complete");
  
  OutputFormatter.section("Next steps");
  OutputFormatter.list([
    "1. Start the Stigmergy service: 'stigmergy start-service'",
    "2. Connect your IDE to the Stigmergy service (port 3010 by default)",
    "3. Use natural language commands through your IDE"
  ]);
  
  return true;
}

export async function interactiveInit() {
  OutputFormatter.section("Stigmergy Interactive Initialization");
  
  const targetDir = process.cwd();
  OutputFormatter.step(`Initializing Stigmergy in: ${targetDir}`);
  
  // Ask user for project name
  const { projectName } = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name:',
      default: path.basename(targetDir)
    }
  ]);
  
  // Ask user for features they want to enable
  const { features } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to enable:',
      choices: [
        { name: 'Neo4j Graph Database', value: 'neo4j', checked: true },
        { name: 'Automation Mode', value: 'automation', checked: true },
        { name: 'Provider Isolation', value: 'provider_isolation', checked: true },
        { name: 'DeepCode Integration', value: 'deepcode_integration', checked: true }
      ]
    }
  ]);
  
  // Create .stigmergy directory
  const stigmergyDir = path.join(targetDir, ".stigmergy");
  await fs.ensureDir(stigmergyDir);
  
  // Create configuration based on user input
  const configPath = path.join(stigmergyDir, "config.js");
  const neo4jSetting = features.includes('neo4j') ? '"auto"' : '"memory"';
  const automationMode = features.includes('automation') ? '"autonomous"' : '"approval_required"';
  
  const configContent = `// Stigmergy Project Configuration
import path from "path";

export default {
  projectName: "${projectName}",
  features: {
    neo4j: ${neo4jSetting}, // Options: 'required', 'auto', 'memory'
    automation_mode: ${automationMode}, // Options: 'autonomous', 'approval_required', 'hybrid'
    provider_isolation: ${features.includes('provider_isolation')},
    deepcode_integration: ${features.includes('deepcode_integration')},
  },
  // Add your project-specific configuration here
};`;
  
  await fs.writeFile(configPath, configContent);
  OutputFormatter.success("Created configuration file based on your preferences");
  
  // Create .env.stigmergy.example file
  const envExamplePath = path.join(stigmergyDir, ".env.stigmergy.example");
  const sourceEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env.example');
  if (await fs.pathExists(sourceEnv)) {
    await fs.copy(sourceEnv, envExamplePath);
    OutputFormatter.success("Created environment example file");
  }
  
  // Create directories for trajectories, state, logs, and traces
  await fs.ensureDir(path.join(stigmergyDir, "trajectories"));
  await fs.ensureDir(path.join(stigmergyDir, "state"));
  await fs.ensureDir(path.join(stigmergyDir, "logs"));
  await fs.ensureDir(path.join(stigmergyDir, "traces"));
  
  // Ask user if they want to configure API keys now
  const { configureKeys } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'configureKeys',
      message: 'Would you like to configure your API keys now?',
      default: true
    }
  ]);
  
  if (configureKeys) {
    // Read the .env.stigmergy.example file
    if (await fs.pathExists(envExamplePath)) {
      const envExampleContent = await fs.readFile(envExamplePath, 'utf8');
      const keyLines = envExampleContent.split('\n').filter(line => line.includes('_KEY='));
      
      // Create .env file
      const envPath = path.join(stigmergyDir, ".env");
      let envContent = '';
      
      // Process each key
      for (const line of keyLines) {
        const keyName = line.split('=')[0];
        let link = 'provider website';
        
        // Provide specific links for known providers
        if (keyName === 'GOOGLE_API_KEY') {
          link = 'https://ai.google.dev/';
        } else if (keyName === 'GITHUB_TOKEN') {
          link = 'https://github.com/settings/tokens';
        } else if (keyName === 'OPENROUTER_API_KEY') {
          link = 'https://openrouter.ai/';
        }
        
        const { keyValue } = await inquirer.prompt([
          {
            type: 'input',
            name: 'keyValue',
            message: `Please enter your ${keyName} (you can get one at ${link}):`
          }
        ]);
        
        envContent += `${keyName}=${keyValue}\n`;
      }
      
      // Write the .env file
      await fs.writeFile(envPath, envContent);
      OutputFormatter.success("API keys configured successfully");
    }
  }
  
  OutputFormatter.success("Stigmergy project initialization complete");
  
  OutputFormatter.section("Next steps");
  OutputFormatter.list([
    "1. Start the Stigmergy service: 'stigmergy start-service'",
    "2. Connect your IDE to the Stigmergy service (port 3010 by default)",
    "3. Use natural language commands through your IDE"
  ]);
  
  return true;
}