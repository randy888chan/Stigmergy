/**
 * @description Tools for managing an asynchronous task queue in the state manager.
 */

import { z } from "zod";

const taskSchema = z.object({
  task_id: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()),
  status: z.string(),
  priority: z.number().default(10), // Lower number means higher priority
});

/**
 * @description Enqueues one or more tasks into the shared task queue.
 * @param {object} params - The parameters for the tool.
 * @param {Array<object>} params.tasks - An array of task objects to be added to the queue.
 * @param {object} context - The context object.
 * @param {GraphStateManager} context.stateManager - The state manager instance.
 * @returns {Promise<object>} A result object indicating success or failure.
 */
export async function enqueue_tasks({ tasks }, { stateManager }) {
  try {
    // Validate the input tasks against the schema
    z.array(taskSchema).parse(tasks);
  } catch (error) {
    return {
      status: "error",
      message: `Task validation failed: ${error.message}`,
    };
  }

  const currentState = await stateManager.getState();
  const currentQueue = currentState.task_queue || [];

  // Prevent adding duplicate tasks
  const newTasks = tasks.filter(
    (task) => !currentQueue.some((queuedTask) => queuedTask.task_id === task.task_id)
  );

  if (newTasks.length === 0) {
    return {
      status: "success",
      message: "All provided tasks are already in the queue.",
      enqueued_count: 0,
    };
  }

  const updatedQueue = [...currentQueue, ...newTasks];

  await stateManager.updateState({
    type: "TASK_QUEUE_UPDATED",
    task_queue: updatedQueue,
  });

  return {
    status: "success",
    message: `Successfully enqueued ${newTasks.length} new tasks.`,
    enqueued_count: newTasks.length,
  };
}

/**
 * @description Retrieves and removes the next task from the queue.
 * @param {object} _ - Unused parameters.
 * @param {object} context - The context object.
 * @param {GraphStateManager} context.stateManager - The state manager instance.
 * @returns {Promise<object|null>} The next task object from the queue, or null if the queue is empty.
 */
export async function pop_next_task(_, { stateManager }) {
  const currentState = await stateManager.getState();
  const currentQueue = currentState.task_queue || [];

  if (currentQueue.length === 0) {
    return null; // Return null if the queue is empty
  }

  // Find the task with the lowest priority number (highest priority)
  let highestPriorityTask = currentQueue[0];
  let highestPriorityIndex = 0;
  for (let i = 1; i < currentQueue.length; i++) {
    if (currentQueue[i].priority < highestPriorityTask.priority) {
      highestPriorityTask = currentQueue[i];
      highestPriorityIndex = i;
    }
  }

  // Remove the highest priority task from the queue
  currentQueue.splice(highestPriorityIndex, 1);

  await stateManager.updateState({
    type: "TASK_QUEUE_UPDATED",
    task_queue: currentQueue,
  });

  const nextTask = highestPriorityTask;

  return nextTask;
}
