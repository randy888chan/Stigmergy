import inquirer from 'inquirer';
import { init } from './init.js';
import { ComprehensiveHealthCheck } from '../../../../scripts/health-check.js';
import { startService } from './service.js';
import { OutputFormatter } from '../utils/output_formatter.js';
import { writeFile } from 'fs/promises';
import path from 'path';

export async function setup() {
  OutputFormatter.section("Welcome to the Stigmergy Setup Wizard!");
  OutputFormatter.info("This wizard will guide you through the process of setting up your project.");

  // Step 1: Initialize the project
  await init({ interactive: true });

  // Step 2: Ask for API keys
  OutputFormatter.info("\\nNow, let's configure your AI provider API keys.");
  const { apiKeyChoice } = await inquirer.prompt([
    {
      type: 'list',
      name: 'apiKeyChoice',
      message: 'Which AI provider will you be using?',
      choices: ['OpenRouter', 'Google', 'Other'],
    },
  ]);

  let envContent = '';
  if (apiKeyChoice === 'OpenRouter') {
    const { openRouterApiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'openRouterApiKey',
        message: 'Please enter your OpenRouter API Key:',
        mask: '*',
      },
    ]);
    envContent += `OPENROUTER_API_KEY=${openRouterApiKey}\\n`;
    envContent += `OPENROUTER_BASE_URL=https://openrouter.ai/api/v1\\n`;
  } else if (apiKeyChoice === 'Google') {
    const { googleApiKey } = await inquirer.prompt([
      {
        type: 'password',
        name: 'googleApiKey',
        message: 'Please enter your Google API Key:',
        mask: '*',
      },
    ]);
    envContent += `GOOGLE_API_KEY=${googleApiKey}\\n`;
  } else {
    OutputFormatter.warning(
      "You'll need to manually edit the .env.development file later with your specific provider's credentials."
    );
  }

  // Step 3: Create the .env.development file
  if (envContent) {
    try {
      const envPath = path.join(process.cwd(), '.env.development');
      await writeFile(envPath, envContent);
      OutputFormatter.success(`Successfully created .env.development file at ${envPath}`);
    } catch (error) {
      OutputFormatter.error('Failed to create .env.development file.');
      console.error(error);
      const { continueSetup } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'continueSetup',
          message: 'An error occurred writing the .env file. Do you want to continue with the setup?',
          default: false,
        },
      ]);
      if (!continueSetup) {
        return;
      }
    }
  }

  // Step 4: Ask to run a health check
  const { runHealthCheck } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runHealthCheck',
      message: '\\nWould you like to run a health check to verify your setup?',
      default: true,
    },
  ]);

  if (runHealthCheck) {
    const healthCheck = new ComprehensiveHealthCheck();
    await healthCheck.run();
  }

  // Step 5: Ask to start the service
  const { runStartService } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runStartService',
      message: 'Would you like to start the Stigmergy service now?',
      default: true,
    },
  ]);

  if (runStartService) {
    await startService();
  }

  OutputFormatter.success("\\nSetup complete! You are now ready to use Stigmergy.");
  OutputFormatter.info("To get started, run 'stigmergy run --goal \\"Your objective here\\"'");
}
