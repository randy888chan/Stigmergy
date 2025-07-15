const fs = require("fs-extra");
const path = require("path");
const yaml = require("js-yaml");

const CWD = process.cwd();
const DOCS_PATH = path.join(CWD, "docs");
const BLUEPRINT_PATH = path.join(CWD, "execution-blueprint.yml");

const fileExists = async (fileName) => fs.pathExists(path.join(CWD, fileName));

function findNextPendingTask(manifest) {
  if (!manifest || !manifest.tasks) return null;
  return manifest.tasks.find(task => {
    if (task.status !== "PENDING") return false;
    const dependenciesMet = !task.dependencies || task.dependencies.every(depId => {
      const depTask = manifest.tasks.find(t => t.id === depId);
      return depTask && depTask.status === "COMPLETED";
    });
    return dependenciesMet;
  });
}

async function getNextAction(state) {
  // Phase 3: Execution
  if (await fileExists("execution-blueprint.yml")) {
    if (!state.project_manifest || state.project_manifest.tasks?.length === 0) {
        // Ingest blueprint into state if not already done
        const blueprintContent = await fs.readFile(BLUEPRINT_PATH, 'utf8');
        const blueprint = yaml.load(blueprintContent);
        state.project_manifest = blueprint; // This should be saved by the caller
        return {
            type: "SYSTEM_TASK",
            agent: "dispatcher",
            task: "Ingest the execution-blueprint.yml into the project state.",
            summary: "Found execution blueprint. Ingesting into state manifest.",
            newStatus: "READY_FOR_EXECUTION",
        };
    }

    if (state.project_status !== "PROJECT_COMPLETE" && state.project_status !== "EXECUTION_HALTED") {
      const nextTask = findNextPendingTask(state.project_manifest);
      if (nextTask) {
        return {
          type: "EXECUTION_TASK",
          agent: nextTask.agent,
          task: `Execute the task '${nextTask.id}': ${nextTask.summary}. Review the full blueprint for context.`,
          summary: `Dispatching task '${nextTask.id}' to agent '@${nextTask.agent}'.`,
          newStatus: "EXECUTION_IN_PROGRESS",
          taskId: nextTask.id,
        };
      } else if (state.project_manifest?.tasks?.every(t => t.status === "COMPLETED")) {
        return { type: "SYSTEM_TASK", agent: "dispatcher", task: "Finalize project.", summary: "All tasks completed.", newStatus: "PROJECT_COMPLETE" };
      }
    }
  }

  // Phase 2: Planning
  if (await fileExists("docs/prd.md") && !(await fileExists("docs/architecture.md"))) {
    return { type: "PLANNING_TASK", agent: "design-architect", task: "Create `docs/architecture.md` from the PRD.", summary: "Dispatching @winston for architecture.", newStatus: "NEEDS_ARCHITECTURE" };
  }
  if (await fileExists("docs/brief.md") && !(await fileExists("docs/prd.md"))) {
    return { type: "PLANNING_TASK", agent: "pm", task: "Create `docs/prd.md` from the Project Brief.", summary: "Dispatching @john for PRD.", newStatus: "NEEDS_PRD" };
  }

  // Phase 1: Briefing
  if (!await fileExists("docs/brief.md")) {
    return { type: "PLANNING_TASK", agent: "analyst", task: `Create a 'docs/brief.md' for the goal: "${state.goal}".`, summary: "Dispatching @mary for Project Brief.", newStatus: "NEEDS_BRIEFING" };
  }

  // Default/Idle State
  return { type: "WAITING", summary: `System is in '${state.project_status}' state. No immediate action required.` };
}

module.exports = { getNextAction };
