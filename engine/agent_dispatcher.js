const fs = require("fs-extra");
const path = require("path");
const stateManager = require("./state_manager");

const CWD = process.cwd();
const DOCS_PATH = path.join(CWD, "docs");
const BLUEPRINT_PATH = path.join(CWD, "execution-blueprint.yml");

// Helper to check for file existence
const fileExists = async (fileName) => fs.pathExists(path.join(DOCS_PATH, fileName));

function findNextPendingTask(manifest) {
  if (!manifest || !manifest.tasks) return null;
  for (const task of manifest.tasks) {
    if (task.status === "PENDING") {
      const dependenciesMet =
        !task.dependencies ||
        task.dependencies.every((depId) => {
          const depTask = manifest.tasks.find((t) => t.id === depId);
          return depTask && depTask.status === "COMPLETED";
        });
      if (dependenciesMet) return task;
    }
  }
  return null;
}

async function getNextAction(state) {
  // --- Phase 3: Execution ---
  // If a blueprint exists, the highest priority is to execute it.
  if (await fs.pathExists(BLUEPRINT_PATH)) {
    if (
      state.project_status !== "PROJECT_COMPLETE" &&
      state.project_status !== "EXECUTION_HALTED"
    ) {
      const nextTask = findNextPendingTask(state.project_manifest);
      if (nextTask) {
        return {
          type: "EXECUTION_TASK",
          agent: nextTask.agent,
          task: `Execute the task '${nextTask.id}' defined in 'execution-blueprint.yml'. Task summary: ${nextTask.summary}`,
          summary: `Dispatching task '${nextTask.id}' to agent '@${nextTask.agent}'.`,
          newStatus: "EXECUTION_IN_PROGRESS",
        };
      } else if (state.project_manifest?.tasks?.every((t) => t.status === "COMPLETED")) {
        return {
          type: "SYSTEM_TASK",
          agent: "dispatcher", // A system-level agent
          task: "Finalize project.",
          summary: "All tasks completed. Project is finished.",
          newStatus: "PROJECT_COMPLETE",
        };
      }
    }
  }

  // --- Phase 2: Planning ---
  // The system checks for planning documents in reverse order to find the first missing one.

  // Step 2.3: Create Blueprint
  if (
    (await fileExists("architecture.md")) &&
    (await fileExists("prd.md")) &&
    !(await fs.pathExists(BLUEPRINT_PATH))
  ) {
    return {
      type: "PLANNING_TASK",
      agent: "design-architect",
      task: "All strategic documents are present. Create the final `execution-blueprint.yml` from `docs/architecture.md`.",
      summary: "Dispatching @winston to create the final execution blueprint.",
      newStatus: "NEEDS_BLUEPRINT",
    };
  }

  // Step 2.2: Create Architecture
  if (
    (await fileExists("prd.md")) &&
    !(await fileExists("architecture.md"))
  ) {
    return {
      type: "PLANNING_TASK",
      agent: "design-architect",
      task: "The PRD exists. Create the `docs/architecture.md` document based on its requirements.",
      summary: "Project requires an architecture document. Dispatching @winston.",
      newStatus: "NEEDS_ARCHITECTURE",
    };
  }

  // Step 2.1: Create PRD
  if (
    (await fileExists("brief.md")) &&
    !(await fileExists("prd.md"))
  ) {
    return {
      type: "PLANNING_TASK",
      agent: "pm",
      task: "The Project Brief exists. Create the `docs/prd.md` from its constraints and goals.",
      summary: "Project requires a PRD. Dispatching @john.",
      newStatus: "NEEDS_PRD",
    };
  }

  // --- Phase 1: Briefing ---
  if (!(await fileExists("brief.md"))) {
    return {
      type: "PLANNING_TASK",
      agent: "analyst",
      task: `A project goal has been set: "${
        state.goal || "Not specified"
      }". Create a 'docs/brief.md' based on this goal.`,
      summary: "Project requires a brief. Dispatching @mary.",
      newStatus: "NEEDS_BRIEFING",
    };
  }

  // --- Default/Idle State ---
  return {
    type: "WAITING",
    summary: `System is in '${state.project_status}' state. All planning docs exist, awaiting blueprint execution to start.`,
  };
}

module.exports = { getNextAction };
