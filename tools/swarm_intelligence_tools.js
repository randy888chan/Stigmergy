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
    const lines = data.trim().split('\n');
    const failures = lines.map(line => {
        try { return JSON.parse(line); }
        catch { return null; }
    }).filter(Boolean); // Filter out any nulls from parsing errors

    if (failures.length === 0) {
      return "No valid failure reports found to analyze.";
    }

    // Pattern analysis based on tags
    const tagCounts = failures.reduce((acc, failure) => {
      if (failure.tags && Array.isArray(failure.tags)) {
        failure.tags.forEach(tag => {
          acc[tag] = (acc[tag] || 0) + 1;
        });
      }
      return acc;
    }, {});

    if (Object.keys(tagCounts).length === 0) {
      return `Analyzed ${failures.length} failures, but no common tags were found to identify a pattern.`;
    }

    const mostCommonPattern = Object.entries(tagCounts).reduce((a, b) => a[1] > b[1] ? a : b);
    const [tag, count] = mostCommonPattern;

    return `Analyzed ${failures.length} failures. The most common failure pattern (${count} times) is related to the tag: '${tag}'. Recommendation: Investigate issues related to ${tag}.`;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return "No failure reports have been logged yet.";
    }
    console.error(`[Swarm Intelligence] Error in get_failure_patterns: ${error.message}`);
    return `Error analyzing failure patterns: ${error.message}`;
  }
}
