import inquirer from 'inquirer';
import { init } from './init.js';
import { ComprehensiveHealthCheck } from '../../scripts/health-check.js';
import { startService } from './service.js';
import { OutputFormatter } from '../utils/output_formatter.js';

export async function setup() {
  OutputFormatter.section("Welcome to the Stigmergy Setup Wizard!");
  OutputFormatter.info("This wizard will guide you through the process of setting up your project.");

  // Step 1: Initialize the project
  await init({ interactive: true });

  // Step 2: Ask to run a health check
  const { runHealthCheck } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'runHealthCheck',
      message: 'Would you like to run a health check to verify your setup?',
      default: true,
    },
  ]);

  if (runHealthCheck) {
    const healthCheck = new ComprehensiveHealthCheck();
    await healthCheck.run();
  }

  // Step 3: Ask to start the service
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

  OutputFormatter.success("Setup complete! You are now ready to use Stigmergy.");
}
