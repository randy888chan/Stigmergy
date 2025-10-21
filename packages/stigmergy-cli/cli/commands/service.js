import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { OutputFormatter } from "../utils/output_formatter.js";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SERVICE_NAME = 'stigmergy-engine';

// --- Service management functions using PM2 ---

export async function startService(options = {}) {
  OutputFormatter.section("Stigmergy Service Management (PM2)");
  OutputFormatter.step("Starting Stigmergy service with PM2...");

  try {
    // Get the path to the engine server relative to this script
    // The path needs to be relative to the project root where the command is likely run from.
    const enginePath = path.resolve(__dirname, '../../../../engine/server.js');

    // Stop and delete any existing process with the same name to ensure a clean start
    try {
      execSync(`pm2 stop ${SERVICE_NAME} && pm2 delete ${SERVICE_NAME}`, { stdio: 'ignore' });
      OutputFormatter.info(`Cleaned up existing '${SERVICE_NAME}' service.`);
    } catch (error) {
      // Ignore errors, it likely means the service wasn't running
    }

    // Start the service using PM2
    execSync(`pm2 start ${enginePath} --name "${SERVICE_NAME}" --interpreter bun`, { stdio: 'pipe' });

    OutputFormatter.success(`Stigmergy service '${SERVICE_NAME}' started successfully with PM2.`);
    console.log(chalk.bold(`🚀 Access Dashboard: http://localhost:3010`));
    OutputFormatter.info(`Use 'pm2 logs ${SERVICE_NAME}' to view logs.`);
    OutputFormatter.info(`Use 'stigmergy stop-service' to stop.`);
    return true;
  } catch (error) {
    OutputFormatter.error(`Failed to start service with PM2: ${error.message}`);
    console.error(chalk.red(error.stderr ? error.stderr.toString() : 'An unexpected error occurred.'));
    OutputFormatter.info("Please ensure PM2 is installed and configured correctly ('npm install -g pm2'). Although it is a dependency, sometimes global installation is required.");
    return false;
  }
}

export async function stopService() {
  OutputFormatter.section("Stigmergy Service Management (PM2)");
  OutputFormatter.step(`Stopping Stigmergy service '${SERVICE_NAME}'...`);

  try {
    execSync(`pm2 stop ${SERVICE_NAME} && pm2 delete ${SERVICE_NAME}`, { stdio: 'pipe' });
    OutputFormatter.success(`Stigmergy service '${SERVICE_NAME}' stopped and deleted from PM2 list.`);
    return true;
  } catch (error) {
    OutputFormatter.error(`Failed to stop service with PM2: ${error.message}`);
    console.error(chalk.red(error.stderr ? error.stderr.toString() : 'The service may not have been running.'));
    return false;
  }
}

export async function serviceStatus() {
  OutputFormatter.section("Stigmergy Service Status (PM2)");
  try {
    // Execute `pm2 show` and capture output
    const output = execSync(`pm2 show ${SERVICE_NAME}`, { encoding: 'utf-8' });
    // A simple way to display status is to just print the relevant parts of the output
    console.log(chalk.green(`Service '${SERVICE_NAME}' is running.`));
    console.log(output);
  } catch (error) {
    OutputFormatter.warning(`Stigmergy service '${SERVICE_NAME}' is not running.`);
    OutputFormatter.info(`Start the service with: stigmergy start-service`);
  }
}
