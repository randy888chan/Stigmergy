const fs = require('fs-extra');
const path = require('path');
const stateManager = require('./state_manager');

const CWD = process.cwd();
const DOCS_PATH = path.join(CWD, 'docs');
const BLUEPRINT_PATH = path.join(CWD, 'execution-blueprint.yml');

// Helper to check for file existence
const fileExists = (fileName) => fs.pathExists(path.join(DOCS_PATH, fileName));

async function getNextAction(state) {
  // --- Execution Phase ---
  // If a blueprint exists, the highest priority is to execute it.
  if (await fs.pathExists(BLUEPRINT_PATH)) {
    if (state.project_status !== 'PROJECT_COMPLETE' && state.project_status !== 'EXECUTION_HALTED') {
      const nextTask = findNextPendingTask(state.project_manifest);
      if (nextTask) {
        return {
          type: 'EXECUTION_TASK',
          agent: nextTask.agent,
          task: nextTask.path,
          summary: `Dispatching task '${nextTask.id}' to agent '@${nextTask.agent}'.`,
          newStatus: 'EXECUTION_IN_PROGRESS',
        };
      } else if (state.project_manifest?.tasks?.every(t => t.status === 'COMPLETED')) {
          await stateManager.updateStatus('PROJECT_COMPLETE');
          return { type: 'WAITING', summary: 'All tasks completed. Project is finished.' };
      }
      return { type: 'WAITING', summary: 'Execution phase, but no pending tasks found.' };
    }
  }

  // --- Planning Phase (Artifact-Aware Logic) ---
  // The system checks for documents in reverse order to find the first missing one.

  if (!(await fileExists('architecture.md'))) {
    return {
      type: 'PLANNING_TASK',
      agent: 'design-architect',
      task: 'create_architecture',
      summary: "Project requires an architecture document. Dispatching @winston.",
      newStatus: 'NEEDS_ARCHITECTURE',
    };
  }

  if (!(await fileExists('prd.md'))) {
    return {
      type: 'PLANNING_TASK',
      agent: 'pm',
      task: 'create_prd',
      summary: "Project requires a PRD. Dispatching @john.",
      newStatus: 'NEEDS_PRD',
    };
  }

  if (!(await fileExists('brief.md'))) {
    return {
      type: 'PLANNING_TASK',
      agent: 'analyst',
      task: 'create_brief',
      summary: "Project requires a brief. Dispatching @mary.",
      newStatus: 'NEEDS_BRIEFING',
    };
  }
  
  // If all documents exist but the blueprint does not, the final planning step is to create it.
  if (!(await fs.pathExists(BLUEPRINT_PATH))) {
     return {
        type: 'PLANNING_TASK',
        agent: 'design-architect',
        task: 'create_blueprint',
        summary: "All strategic documents are present. Dispatching @winston to create the final execution blueprint.",
        newStatus: 'NEEDS_BLUEPRINT',
      };
  }

  // --- Default/Idle State ---
  return {
    type: 'WAITING',
    summary: `System is in '${state.project_status}' state. No action required.`,
  };
}

function findNextPendingTask(manifest) {
  // This logic remains the same as previously defined
  if (!manifest || !manifest.tasks) return null;
  for (const task of manifest.tasks) {
    if (task.status === 'PENDING') {
      const dependenciesMet = !task.dependencies || task.dependencies.every(depId => {
        const depTask = manifest.tasks.find(t => t.id === depId);
        return depTask && depTask.status === 'COMPLETED';
      });
      if (dependenciesMet) return task;
    }
  }
  return null;
}

module.exports = { getNextAction };
