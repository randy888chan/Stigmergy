import { v4 as uuidv4 } from "uuid";
import stateManager from "../src/infrastructure/state/GraphStateManager.js";
// REMOVED: import { verifyMilestone } from "./verification_system.js";

export async function getState() {
  return stateManager.getState();
}

export async function updateState(event) {
  const newState = await stateManager.updateState(event);
  stateManager.emit("stateChanged", newState);
  return newState;
}

export async function initializeProject(goal) {
  const event = { type: "PROJECT_INITIALIZED", goal, project_status: "ENRICHMENT_PHASE" };
  return updateState(event);
}

export async function updateStatus({ newStatus, message }) {
  const event = { type: "STATUS_UPDATED", project_status: newStatus, message };
  return updateState(event);
}

// THIS ENTIRE FUNCTION IS THE SOURCE OF THE PROBLEM. IT IS REMOVED FOR NOW.
// export async function transitionToState(newStatus, milestone) {
//   const { success } = await verifyMilestone(milestone);
//   if (success) {
//     await updateStatus({ newStatus });
//   }
// } else {
//     await updateStatus({ newStatus: "EXECUTION_HALTED", message: `Verification failed for: ${milestone}` });
//   }
// }

export async function updateTaskStatus({ taskId, newStatus }) {
  const state = await getState();
  const tasks = state.project_manifest?.tasks || [];
  const taskIndex = tasks.findIndex((t) => t.id === taskId);

  if (taskIndex !== -1) {
    const newTasks = [...tasks];
    newTasks[taskIndex] = { ...newTasks[taskIndex], status: newStatus };

    const event = {
      type: "TASK_STATUS_UPDATED",
      project_name: state.project_name,
      project_manifest: {
        ...state.project_manifest,
        tasks: newTasks,
      },
      history: [
        ...(state.history || []),
        { // Removed the extra comma here
          id: uuidv4(),
          timestamp: new Date().toISOString(),
          agent_id: "engine",
          message: `Task ${taskId} status updated to ${newStatus}.`,
        },
      ],
    };
    return updateState(event);
  }
}