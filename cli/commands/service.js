import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { OutputFormatter } from "../utils/output_formatter.js";
import { spawn, execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to get the global config directory
function getGlobalConfigDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  return path.join(homeDir, '.stigmergy');
}

const PID_FILE = path.join(getGlobalConfigDir(), 'service.pid');
const LOG_FILE = path.join(getGlobalConfigDir(), 'service.log');
const ERR_LOG_FILE = path.join(getGlobalConfigDir(), 'service.err.log');

// --- Service management functions ---

export async function startService(options = {}) {
  OutputFormatter.section("Stigmergy Service Management");
  OutputFormatter.step("Starting Stigmergy service...");

  try {
    if (await isServiceRunning()) {
      OutputFormatter.warning("Stigmergy service is already running.");
      return true;
    }

    // Ensure global config directory and log files exist
    await fs.ensureDir(getGlobalConfigDir());

    // Get the path to the engine server relative to this script
    const enginePath = path.resolve(__dirname, '../../engine/server.js');

    // Open log files for stdout and stderr
    const out = fs.openSync(LOG_FILE, 'a');
    const err = fs.openSync(ERR_LOG_FILE, 'a');

    // Start the service as a detached background process, redirecting output to log files
    const serviceProcess = spawn('node', [enginePath], {
      detached: true,
      stdio: ['ignore', out, err] // 'ignore' stdin, pipe stdout and stderr
    });

    // Unref the process so the parent can exit
    serviceProcess.unref();

    // Save the PID to a file for easy management
    await fs.writeFile(PID_FILE, serviceProcess.pid.toString());

    // Give the service a moment to start up
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (await isServiceRunning()) {
      OutputFormatter.success("Stigmergy service started successfully.");
      OutputFormatter.info(`Service PID: ${serviceProcess.pid}`);
      OutputFormatter.info(`Logs are being written to: ${LOG_FILE}`);
      OutputFormatter.info(`Errors are being written to: ${ERR_LOG_FILE}`);
      return true;
    } else {
      OutputFormatter.error("Failed to start Stigmergy service.");
      OutputFormatter.error(`Check the error log for details: ${ERR_LOG_FILE}`);
      const errorLog = await fs.readFile(ERR_LOG_FILE, 'utf8');
      if (errorLog) {
        console.log(chalk.red('\n--- Recent Errors ---'));
        console.log(errorLog.slice(-1000)); // Show last 1000 characters of the error log
      }
      return false;
    }
  } catch (error) {
    OutputFormatter.error(`Failed to start service: ${error.message}`);
    return false;
  }
}

export async function stopService() {
  OutputFormatter.section("Stigmergy Service Management");
  OutputFormatter.step("Stopping Stigmergy service...");

  try {
    if (!await fs.pathExists(PID_FILE)) {
      OutputFormatter.warning("Service does not appear to be running (no PID file found).");
      return false;
    }

    const pid = parseInt(await fs.readFile(PID_FILE, 'utf8'), 10);
    
    try {
      // process.kill is a cross-platform way to send a signal
      process.kill(pid, 'SIGTERM');
      await fs.remove(PID_FILE);
      OutputFormatter.success(`Stigmergy service with PID ${pid} stopped.`);
      return true;
    } catch (e) {
      if (e.code === 'ESRCH') {
        OutputFormatter.warning(`Process with PID ${pid} not found. Removing stale PID file.`);
        await fs.remove(PID_FILE);
        return false;
      }
      throw e;
    }
  } catch (error) {
    OutputFormatter.error(`Failed to stop service: ${error.message}`);
    return false;
  }
}

export async function serviceStatus() {
  OutputFormatter.section("Stigmergy Service Status");

  if (await isServiceRunning()) {
    const pid = await fs.readFile(PID_FILE, 'utf8');
    OutputFormatter.success(`Stigmergy service is running with PID ${pid}.`);
    OutputFormatter.info(`Service endpoint: http://localhost:3010`);
  } else {
    OutputFormatter.warning("Stigmergy service is not running.");
    OutputFormatter.info("Start the service with: stigmergy start-service");
  }
}

// Helper function to check if service is running by checking the PID
async function isServiceRunning() {
  if (!await fs.pathExists(PID_FILE)) {
    return false;
  }
  const pid = parseInt(await fs.readFile(PID_FILE, 'utf8'), 10);
  try {
    // Sending signal 0 to a process checks if it exists without killing it
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return e.code === 'EPERM'; // Process exists but we don't have permission
  }
}