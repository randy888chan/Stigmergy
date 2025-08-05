/**
 * @module model_monitoring
 * @description A service for tracking AI model performance and gathering feedback data.
 * In a real-world implementation, this would connect to a database or a dedicated logging service.
 */

/**
 * Tracks the outcome of a specific task.
 * @param {object} args
 * @param {string} args.taskId - The ID of the task being tracked.
 * @param {boolean} args.success - Whether the task was completed successfully.
 * @param {string} args.agentId - The ID of the agent that performed the task.
 * @param {string} [args.failureReason] - If the task failed, the reason why.
 */
export function trackTaskSuccess({ taskId, success, agentId, failureReason }) {
  const log = {
    metric: "task_outcome",
    timestamp: new Date().toISOString(),
    taskId,
    success,
    agentId,
    ...(failureReason && { failureReason }),
  };
  // In a real system, this would write to a database or logging service.
  // For now, we just log it to the console.
  console.log(`[ModelMonitoring] ${JSON.stringify(log)}`);
}

/**
 * Tracks the usage of a specific tool.
 * @param {object} args
 * @param {string} args.toolName - The name of the tool used (e.g., 'file_system.writeFile').
 * @param {boolean} args.success - Whether the tool execution was successful.
 * @param {string} args.agentId - The ID of the agent that used the tool.
 * @param {number} args.executionTime - The time it took to execute the tool in ms.
 */
export function trackToolUsage({ toolName, success, agentId, executionTime }) {
  const log = {
    metric: "tool_usage",
    timestamp: new Date().toISOString(),
    toolName,
    success,
    agentId,
    executionTime,
  };
  // For now, we just log it to the console.
  console.log(`[ModelMonitoring] ${JSON.stringify(log)}`);
}

/**
 * Gathers user feedback on a specific agent response.
 * @param {object} args
 * @param {string} args.interactionId - A unique ID for the agent-user interaction.
 * @param {number} args.rating - A user-provided rating (e.g., 1-5).
 * @param {string} [args.comment] - Optional user comment.
 */
export function recordUserFeedback({ interactionId, rating, comment }) {
  const log = {
    metric: "user_feedback",
    timestamp: new Date().toISOString(),
    interactionId,
    rating,
    ...(comment && { comment }),
  };
  // For now, we just log it to the console.
  console.log(`[ModelMonitoring] ${JSON.stringify(log)}`);
}
