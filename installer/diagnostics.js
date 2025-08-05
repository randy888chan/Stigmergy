import os from 'os';
import fs from 'fs';
import { runPreChecks } from './precheck.js';

export async function generateDiagnosticReport() {
  const prechecks = await runPreChecks();
  let logContent = '';
  try {
    logContent = fs.readFileSync('stigmergy.log', 'utf-8');
  } catch (error) {
    logContent = 'Could not read stigmergy.log file.';
  }

  return {
    timestamp: new Date().toISOString(),
    system: {
      platform: os.platform(),
      release: os.release(),
      arch: os.arch(),
    },
    node: process.version,
    checks: prechecks,
    logs: logContent,
  };
}
