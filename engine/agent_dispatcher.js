const yaml = require("js-yaml");
const fs = require("fs-extra");
const path = require("path");

const CWD = process.cwd();

const findNextPendingTask = (manifest) => {
  if (!manifest || !manifest.tasks) return null;
  return manifest.tasks.find(task => task.status === "PENDING" && (!task.dependencies || task.dependencies.every(depId => {
    const depTask = manifest.tasks.find(t => t.id === depId);
    return depTask && depTask.status === "COMPLETED";
  })));
};

async function getNextAction(state) {
  const status = state.project_status;

  // --- PHASE 1: THE GRAND BLUEPRINT ---
  if (status === "GRAND_BLUEPRINT_PHASE") {
    // This is a sequence. Find the first un-created artifact.
    if (!state.artifacts_created.brief) {
      return { type: "PLANNING_TASK", agent: "analyst", task: "Autonomously create the Project Brief. Update the shared context upon completion.", newStatus: "GRAND_BLUEPRINT_PHASE" };
    }
    if (!state.artifacts_created.prd) {
      return { type: "PLANNING_TASK", agent: "pm", task: "Using the context, create the PRD. Update context.", newStatus: "GRAND_BLUEPRINT_PHASE" };
    }
    if (!state.artifacts_created.architecture) {
      return { type: "PLANNING_TASK", agent: "design-architect", task: "Using the context, create the Architecture document and all mandatory artifacts (coding standards, QA protocol). Update context.", newStatus: "GRAND_BLUEPRINT_PHASE" };
    }
    if (!state.artifacts_created.blueprint_yaml) {
        return { type: "PLANNING_TASK", agent: "design-architect", task: "Using the approved architecture, generate the final 'execution-blueprint.yml'.", newStatus: "GRAND_BLUEPRINT_PHASE" };
    }
    if (!state.artifacts_created.stories) {
        // Here we'd need to load the blueprint and find the next story to create.
        // This is a simplification; the state manager would handle this logic.
        return { type: "PLANNING_TASK", agent: "sm", task: "Decompose the next task from the blueprint into a detailed story file.", newStatus: "GRAND_BLUEPRINT_PHASE"};
    }
    // If all artifacts are created, the state manager will have already moved to the next phase.
  }
  
  // --- PHASE 3: EXECUTION ---
  if (status === "EXECUTION_PHASE") {
    const nextTask = findNextPendingTask(state.project_manifest);
    if (nextTask) {
      const taskDef = `Execute task '${nextTask.id}': ${nextTask.summary}. The full story is in '.ai/stories/${nextTask.id}.md'. Review it for full context and acceptance criteria.`;
      return { type: "EXECUTION_TASK", agent: nextTask.agent, task: taskDef, summary: `Dispatching task '${nextTask.id}' to agent '@${nextTask.agent}'.`, newStatus: "EXECUTION_PHASE", taskId: nextTask.id };
    } else {
       // All tasks are done. Move to deployment.
      return { type: "SYSTEM_TASK", agent: "dispatcher", task: "All coding tasks complete. Initiating deployment and finalization phase.", newStatus: "DEPLOYMENT_PHASE" };
    }
  }

  // --- PHASE 4 & 5 ---
  if (status === "DEPLOYMENT_PHASE") {
      return { type: "SYSTEM_TASK", agent: "qa", task: "Run final integration tests and testnet deployment scripts as defined in the QA protocol.", newStatus: "DEPLOYMENT_PHASE" };
  }
  if (status === "SELF_IMPROVEMENT_PHASE") {
      return { type: "SYSTEM_TASK", agent: "meta", task: "Project complete. Audit the execution history and logs to find inefficiencies and propose improvements.", newStatus: "PROJECT_COMPLETE"};
  }
  
  // Default/Idle State
  return { type: "IDLE", summary: `System is in '${status}' state. No immediate action required.` };
}

module.exports = { getNextAction };
