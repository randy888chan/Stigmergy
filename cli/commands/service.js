import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import { OutputFormatter } from "../utils/output_formatter.js";
import { spawn, execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Service management functions
export async function startService(options = {}) {
  OutputFormatter.section("Stigmergy Service Management");
  OutputFormatter.step("Starting Stigmergy service...");
  
  try {
    // Check if service is already running
    if (await isServiceRunning()) {
      OutputFormatter.warning("Stigmergy service is already running");
      return true;
    }
    
    // Get the path to the engine server
    const enginePath = path.resolve(__dirname, '../../engine/server.js');
    
    // Start the service as a background process
    const serviceProcess = spawn('node', [enginePath], {
      detached: true,
      stdio: 'ignore'
    });
    
    // Unref the process so it can run independently
    serviceProcess.unref();
    
    // Give the service a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if the service is running
    if (await isServiceRunning()) {
      OutputFormatter.success("Stigmergy service started successfully");
      OutputFormatter.info("Service is now running on port 3010");
      OutputFormatter.info("You can now initialize Stigmergy in any project directory");
      return true;
    } else {
      OutputFormatter.error("Failed to start Stigmergy service");
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
    // Try to find and kill the service process
    const serviceName = 'stigmergy-engine';
    
    // On Unix-like systems, we can use pgrep and pkill
    try {
      execSync(`pkill -f "${serviceName}"`, { stdio: 'ignore' });
      OutputFormatter.success("Stigmergy service stopped successfully");
      return true;
    } catch (error) {
      // If pkill fails, try another approach
      OutputFormatter.warning("Service may not be running or could not be stopped");
      return false;
    }
  } catch (error) {
    OutputFormatter.error(`Failed to stop service: ${error.message}`);
    return false;
  }
}

export async function serviceStatus() {
  OutputFormatter.section("Stigmergy Service Status");
  
  try {
    if (await isServiceRunning()) {
      OutputFormatter.success("Stigmergy service is running");
      OutputFormatter.info("Service endpoint: http://localhost:3010");
      
      // Try to get more detailed status
      try {
        const response = await fetch('http://localhost:3010/api/status');
        if (response.ok) {
          const status = await response.json();
          OutputFormatter.info(`Project: ${status.project_name || 'None'}`);
          OutputFormatter.info(`Status: ${status.project_status || 'Idle'}`);
        }
      } catch (error) {
        // Ignore errors when fetching detailed status
      }
    } else {
      OutputFormatter.warning("Stigmergy service is not running");
      OutputFormatter.info("Start the service with: stigmergy start-service");
    }
  } catch (error) {
    OutputFormatter.error(`Failed to check service status: ${error.message}`);
  }
}

// Helper function to check if service is running
async function isServiceRunning() {
  try {
    const response = await fetch('http://localhost:3010/api/status', { 
      timeout: 1000 
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

// Function to get the global Stigmergy configuration directory
export function getGlobalConfigDir() {
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  return path.join(homeDir, '.stigmergy');
}