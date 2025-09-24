#!/usr/bin/env node
import { execSync } from "child_process";
import * as fs from 'fs-extra';
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";

async function setupQwen() {
  console.log(chalk.blue("🔧 Setting up Qwen Code integration..."));

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "integrationMethod",
      message: "How would you like to integrate Qwen Code?",
      choices: [
        { name: "API Integration (Recommended)", value: "api" },
        { name: "Local CLI Installation", value: "cli" }
      ]
    }
  ]);

  if (answers.integrationMethod === "api") {
    await setupQwenAPI();
  } else {
    await setupQwenCLI();
  }
}

async function setupQwenAPI() {
  console.log(chalk.blue("🔑 Configuring Qwen API integration..."));
  
  const answers = await inquirer.prompt([
    {
      type: "input",
      name: "apiKey",
      message: "Enter your Qwen API key:",
      validate: input => input.length > 0 || "API key is required"
    },
    {
      type: "input", 
      name: "baseUrl",
      message: "Enter Qwen API base URL (optional):",
      default: "https://api.qwen.com/v1"
    }
  ]);

  // Add to .env file
  const envPath = path.join(process.cwd(), '.env');
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }

  if (!envContent.includes('QWEN_API_KEY')) {
    envContent += `\n# Qwen Code Integration\nQWEN_API_KEY=${answers.apiKey}\n`;
    if (answers.baseUrl) {
      envContent += `QWEN_BASE_URL=${answers.baseUrl}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(chalk.green("✅ Qwen API configuration added to .env"));
  }

  await updateStigmergyConfig();
  await createQwenTools();
}

async function setupQwenCLI() {
  console.log(chalk.blue("📦 Setting up Qwen CLI..."));
  
  try {
    // Check if git is available
    execSync("git --version", { stdio: "ignore" });
    
    // Clone Qwen Code repository
    const qwenPath = path.join(process.cwd(), 'qwen-code');
    if (!fs.existsSync(qwenPath)) {
      console.log(chalk.yellow("Cloning Qwen Code repository..."));
      execSync("git clone https://github.com/QwenLM/qwen-code.git", { stdio: "inherit" });
    }
    
    // Install dependencies
    console.log(chalk.yellow("Installing Qwen dependencies..."));
    execSync("cd qwen-code && npm install", { stdio: "inherit" });
    
    console.log(chalk.green("✅ Qwen CLI setup complete"));
    await createQwenCLIIntegration();
    
  } catch (error) {
    console.error(chalk.red("❌ Failed to setup Qwen CLI:"), error.message);
    console.log(chalk.yellow("Falling back to API integration..."));
    await setupQwenAPI();
  }
}

async function updateStigmergyConfig() {
  console.log(chalk.blue("🔄 Updating Stigmergy configuration..."));
  
  const configPath = path.join(process.cwd(), 'stigmergy.config.js');
  const configContent = fs.readFileSync(configPath, 'utf8');
  
  if (!configContent.includes('qwen_tier')) {
    console.log(chalk.yellow("📝 Please manually add Qwen configuration to stigmergy.config.js:"));
    console.log(chalk.blue(`
Add this to your model_tiers:
qwen_tier: {
  provider: "qwen",
  api_key_env: "QWEN_API_KEY", 
  base_url_env: "QWEN_BASE_URL",
  model_name: "qwen-coder-plus",
}
    `));
  }
}

async function createQwenTools() {
  console.log(chalk.blue("🛠️ Creating Qwen integration tools..."));
  
  const qwenToolContent = `import axios from 'axios';
import "dotenv/config.js";

export class QwenCodeIntegration {
  constructor() {
    this.apiKey = process.env.QWEN_API_KEY;
    this.baseUrl = process.env.QWEN_BASE_URL || 'https://api.qwen.com/v1';
  }

  async generateCode({ prompt, language = 'javascript', context = '' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    const fullPrompt = \`\${context ? 'Context: ' + context + '\\n\\n' : ''}Generate \${language} code for: \${prompt}\`;

    try {
      const response = await axios.post(\`\${this.baseUrl}/chat/completions\`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: \`You are Qwen Code, an expert programmer. Generate clean, efficient \${language} code with comments.\`
          },
          {
            role: 'user',
            content: fullPrompt
          }
        ],
        temperature: 0.2,
        max_tokens: 2000
      }, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      });

      return {
        code: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(\`Failed to generate code: \${error.message}\`);
    }
  }

  async reviewCode({ code, language = 'javascript' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    try {
      const response = await axios.post(\`\${this.baseUrl}/chat/completions\`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: 'You are a code reviewer. Analyze the provided code for bugs, performance issues, and best practices.'
          },
          {
            role: 'user',
            content: \`Please review this \${language} code:\\n\\n\${code}\`
          }
        ],
        temperature: 0.1,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      });

      return {
        review: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(\`Failed to review code: \${error.message}\`);
    }
  }

  async explainCode({ code, language = 'javascript' }) {
    if (!this.apiKey) {
      throw new Error('QWEN_API_KEY not configured');
    }

    try {
      const response = await axios.post(\`\${this.baseUrl}/chat/completions\`, {
        model: 'qwen-coder-plus',
        messages: [
          {
            role: 'system',
            content: 'You are a code educator. Explain code clearly and comprehensively.'
          },
          {
            role: 'user',
            content: \`Please explain this \${language} code in detail:\\n\\n\${code}\`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      }, {
        headers: {
          'Authorization': \`Bearer \${this.apiKey}\`,
          'Content-Type': 'application/json'
        }
      });

      return {
        explanation: response.data.choices[0].message.content,
        language,
        model: 'qwen-coder-plus'
      };
    } catch (error) {
      console.error('Qwen API error:', error.response?.data || error.message);
      throw new Error(\`Failed to explain code: \${error.message}\`);
    }
  }
}

// Export tool functions
export async function qwen_generate_code({ prompt, language = 'javascript', context = '' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.generateCode({ prompt, language, context });
}

export async function qwen_review_code({ code, language = 'javascript' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.reviewCode({ code, language });
}

export async function qwen_explain_code({ code, language = 'javascript' }) {
  const qwen = new QwenCodeIntegration();
  return await qwen.explainCode({ code, language });
}

export async function qwen_health_check() {
  const qwen = new QwenCodeIntegration();
  try {
    if (!qwen.apiKey) {
      return { status: 'error', message: 'QWEN_API_KEY not configured' };
    }
    
    // Simple health check
    await qwen.generateCode({ prompt: 'hello world', language: 'javascript' });
    return { status: 'ok', message: 'Qwen Code integration is working' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
`;

  const toolPath = path.join(process.cwd(), 'tools', 'qwen_integration.js');
  fs.writeFileSync(toolPath, qwenToolContent);
  console.log(chalk.green("✅ Qwen integration tools created"));
}

async function createQwenCLIIntegration() {
  console.log(chalk.blue("🔗 Creating Qwen CLI integration..."));
  
  const cliIntegrationContent = `import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';

export class QwenCLIIntegration {
  constructor() {
    this.qwenPath = path.join(process.cwd(), 'qwen-code');
  }

  async generateCodeCLI({ prompt, language = 'javascript', context = '' }) {
    if (!fs.existsSync(this.qwenPath)) {
      throw new Error('Qwen Code CLI not installed. Run setup-qwen.js first.');
    }

    const fullPrompt = \`\${context ? 'Context: ' + context + '\\n\\n' : ''}Generate \${language} code for: \${prompt}\`;
    
    try {
      const result = execSync(\`cd \${this.qwenPath} && python generate.py "\${fullPrompt}" --language \${language}\`, {
        encoding: 'utf8',
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      });

      return {
        code: result.trim(),
        language,
        model: 'qwen-cli'
      };
    } catch (error) {
      console.error('Qwen CLI error:', error.message);
      throw new Error(\`Failed to generate code via CLI: \${error.message}\`);
    }
  }
}

export async function qwen_cli_generate({ prompt, language = 'javascript', context = '' }) {
  const qwen = new QwenCLIIntegration();
  return await qwen.generateCodeCLI({ prompt, language, context });
}
`;

  const cliToolPath = path.join(process.cwd(), 'tools', 'qwen_cli_integration.js');
  fs.writeFileSync(cliToolPath, cliIntegrationContent);
  console.log(chalk.green("✅ Qwen CLI integration created"));
}

// Main execution
setupQwen().catch(console.error);