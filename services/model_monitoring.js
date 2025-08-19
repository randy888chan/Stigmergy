import fs from 'fs-extra';
import path from 'path';

const METRICS_FILE = path.join(process.cwd(), ".ai", "monitoring", "events.jsonl");

async function appendLog(logData) {
  await fs.ensureDir(path.dirname(METRICS_FILE));
  const logString = JSON.stringify({ timestamp: new Date().toISOString(), ...logData });
  await fs.appendFile(METRICS_FILE, logString + '\n');
}

export async function trackTaskSuccess({ taskId, success, agentId, failureReason }) {
  await appendLog({ metric: "task_outcome", taskId, success, agentId, failureReason });
}

export async function trackToolUsage({ toolName, success, agentId, executionTime, error }) {
  await appendLog({ metric: "tool_usage", toolName, success, agentId, executionTime, error });
}
