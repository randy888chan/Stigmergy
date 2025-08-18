// services/model_monitoring.js

import fs from 'fs-extra';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), ".ai", "monitoring", "events.jsonl");

/**
 * Ensures the directory for the metrics file exists.
 */
async function ensureLogFile() {
  await fs.ensureDir(path.dirname(METRICS_FILE));
}

/**
 * Appends a structured log entry to the metrics file.
 * @param {object} logData - The data to log.
 */
async function appendLog(logData) {
  await ensureLogFile();
  const logString = JSON.stringify({
    timestamp: new Date().toISOString(),
    ...logData
  });
  await fs.appendFile(METRICS_FILE, logString + '\n');
}

export async function trackTaskSuccess({ taskId, success, agentId, failureReason }) {
  await appendLog({
    metric: "task_outcome",
    taskId,
    success,
    agentId,
    ...(failureReason && { failureReason }),
  });
}

export async function trackToolUsage({ toolName, success, agentId, executionTime, error }) {
  await appendLog({
    metric: "tool_usage",
    toolName,
    success,
    agentId,
    executionTime,
    ...(error && { error }),
  });
}
