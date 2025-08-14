import { v4 as uuidv4 } from "uuid";
import stateManager from "../src/infrastructure/state/graphStateManager.js";

export async function getState() {
  return stateManager.getState();
}

function validateState(state) {
  if (!state.project_status) throw new TypeError("Missing project_status");
  if (state.project_manifest && !Array.isArray(state.project_manifest.tasks)) {
    throw new TypeError("project_manifest.tasks must be an array");
  }
}

export async function updateState(event) {
  validateState(event); // Add this line
  return stateManager.updateState(event);
}

export async function initializeProject(goal) {
  const projectName = goal.substring(0, 30).replace(/[^a-zA-Z0-9]/g, "-");
  const event = {
    type: "PROJECT_INITIALIZED",
    project_name: projectName,
    goal,
    project_status: "GRAND_BLUEPRINT_PHASE",
    history: [
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: "user",
        agent_id: "system",
        message: `Project initialized: ${goal}`,
      },
    ],
  };
  return stateManager.updateState(event);
}

import { verifyMilestone } from "./verification_system.js";
import swarmMemory from "./swarm_memory.js";

export async function transitionToState(newStatus, milestone) {
  const verified = await verifyMilestone(milestone);
  if (verified) {
    await updateStatus({
      newStatus,
      artifact_created: milestone,
    });
  } else {
    swarmMemory.recordLesson({
      pattern: `milestone-failure-${milestone}`,
      solution: "Reassign to @debugger with full context",
    });
  }
}

export async function updateStatus({ newStatus, message, artifact_created = null }) {
  const state = await getState();
  const event = {
    type: "STATUS_UPDATED",
    project_status: newStatus,
    history: [
      ...state.history,
      {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        source: "system",
        agent_id: "engine",
        message: message || `Status updated to ${newStatus}`,
      },
    ],
  };

  if (
    artifact_created &&
    state.artifacts_created &&
    state.artifacts_created.hasOwnProperty(artifact_created)
  ) {
    event.artifacts_created = {
      ...state.artifacts_created,
      [artifact_created]: true,
    };
  }

  return stateManager.updateState(event);
}

export async function pauseProject() {
  const state = await getState();
  const event = {
    type: "PROJECT_PAUSED",
    status_before_pause: state.project_status,
    project_status: "PAUSED_BY_USER",
  };
  return stateManager.updateState(event);
}

export async function resumeProject() {
  const state = await getState();
  const event = {
    type: "PROJECT_RESUMED",
    project_status: state.status_before_pause || "GRAND_BLUEPRINT_PHASE",
    status_before_pause: null,
  };
  return stateManager.updateState(event);
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

export function subscribeToChanges(callback) {
  stateManager.subscribeToChanges(callback);
}
