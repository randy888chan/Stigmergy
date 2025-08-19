import { v4 as uuidv4 } from "uuid";
import stateManager from "../src/infrastructure/state/GraphStateManager.js";
import { verifyMilestone } from "./verification_system.js";

export async function getState() {
  return stateManager.getState();
}

export async function updateState(event) {
  return stateManager.updateState(event);
}

export async function initializeProject(goal) {
  const event = { type: "PROJECT_INITIALIZED", goal, project_status: "ENRICHMENT_PHASE" };
  return stateManager.updateState(event);
}

export async function updateStatus({ newStatus, message }) {
  const event = { type: "STATUS_UPDATED", project_status: newStatus, message };
  return stateManager.updateState(event);
}

export async function transitionToState(newStatus, milestone) {
  const { success } = await verifyMilestone(milestone);
  if (success) {
    await updateStatus({ newStatus });
  } else {
    await updateStatus({ newStatus: "EXECUTION_HALTED", message: `Verification failed for: ${milestone}` });
  }
}

export async function updateTaskStatus({ taskId, newStatus }) {
  const state = await getState();
  const taskIndex = state.project_manifest?.tasks?.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1 && taskIndex !== undefined) {
    const newTasks = [...state.project_manifest.tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], status: newStatus };

    const event = {
      type: "TASK_STATUS_UPDATED",
      project_name: state.project_name,
      project_manifest: {
        ...state.project_manifest,
        tasks: newTasks,
      },
      history: [
        ...state.history,
        {
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          source: "system",
          agent_id: "engine",
          message: `Task ${taskId} status updated to ${newStatus}.`,
        },
      ],
    };
    return stateManager.updateState(event);
  }
}
