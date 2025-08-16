import AgentPerformance from "../engine/agent_performance.js";
import SwarmMemory from "../engine/swarm_memory.js";
import fs from "fs/promises";
import path from "path";

/**
 * A tool to query the swarm's collective intelligence.
 * @param {string} task_type - The type of task to be performed (e.g., 'coding', 'testing', 'documentation').
 * @returns {Promise<string>} The ID of the best agent for the task, or null if none is found.
 * @description This tool is used to find the most suitable agent for a given task based on historical performance data.
 */
export async function getBestAgentForTask({ task_type }) {
  try {
    const bestAgent = await AgentPerformance.getBestAgentForTask(task_type);
    if (bestAgent) {
      return `The best agent for '${task_type}' is '${bestAgent}'.`;
    } else {
      return `No specific high-performing agent found for '${task_type}'. Consider using the default agent.`;
    }
  } catch (error) {
    console.error(`Error in getBestAgentForTask: ${error.message}`);
    return `Error retrieving best agent: ${error.message}`;
  }
}

/**
 * A tool to retrieve lessons learned from past projects.
 * @param {object} context - The current task context.
 * @param {string[]} tags - A list of tags to filter lessons by.
 * @returns {Promise<object[]>} A list of relevant lessons.
 * @description This tool is used to query the swarm's memory for relevant lessons from past experiences that match the current context.
 */
export async function getLessonsForContext({ context, tags }) {
  try {
    const lessons = await SwarmMemory.getRelevantLessons(context, tags);
    if (lessons.length > 0) {
      return lessons;
    } else {
      return "No relevant lessons found for the given context.";
    }
  } catch (error) {
    console.error(`Error in getLessonsForContext: ${error.message}`);
    return `Error retrieving lessons: ${error.message}`;
  }
}

export async function get_failure_patterns() {
  const filePath = path.join(process.cwd(), '.ai', 'swarm_memory', 'failure_reports.jsonl');
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.trim().split('\\n');
    const failures = lines.map(line => JSON.parse(line));

    if (failures.length === 0) {
      return "No failures found.";
    }

    const patternCounts = failures.reduce((acc, failure) => {
      // Example pattern: combination of tags and root_cause
      const pattern = `${(failure.tags || []).join(':')}:${failure.root_cause || 'unknown'}`;
      acc[pattern] = (acc[pattern] || 0) + 1;
      return acc;
    }, {});

    if (Object.keys(patternCounts).length === 0) {
      return `Found ${failures.length} failures, but could not determine a common pattern.`;
    }

    const mostCommonPattern = Object.entries(patternCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    const [pattern, count] = mostCommonPattern;
    const patternParts = pattern.split(':');
    const rootCause = patternParts.pop();
    const tags = patternParts.join(':');


    return `Found ${failures.length} failures. The most common pattern (${count} times) is '${tags}' related to '${rootCause}' root causes.`;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return "No failure reports found.";
    }
    console.error(`Error in get_failure_patterns: ${error.message}`);
    return `Error analyzing failure patterns: ${error.message}`;
  }
}
