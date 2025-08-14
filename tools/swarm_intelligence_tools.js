import AgentPerformance from "../engine/agent_performance.js";
import SwarmMemory from "../engine/swarm_memory.js";

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
