const stateManager = require('./state_manager');

async function getNextAction(state) {
  switch (state.project_status) {
    case 'NEEDS_BRIEFING':
      return {
        type: 'PLANNING_TASK',
        agent: 'analyst',
        task: 'create_brief',
        summary: "Project requires a brief. Dispatching @mary to create 'docs/brief.md'.",
        newStatus: 'BRIEFING_IN_PROGRESS',
      };

    case 'NEEDS_PLANNING':
      return {
        type: 'PLANNING_TASK',
        agent: 'design-architect',
        task: 'create_blueprint',
        summary: "Brief complete. Dispatching @winston to create the full execution blueprint.",
        newStatus: 'PLANNING_IN_PROGRESS',
      };
    
    case 'NEEDS_INGESTION':
       return {
        type: 'SYSTEM_TASK',
        agent: 'saul',
        task: 'ingest_plan',
        summary: "Blueprint created. Dispatching internal task to ingest plan into state.",
        newStatus: 'INGESTION_IN_PROGRESS',
      };

    case 'READY_FOR_EXECUTION':
    case 'EXECUTION_IN_PROGRESS':
      const nextTask = findNextPendingTask(state.project_manifest);
      if (nextTask) {
        return {
          type: 'EXECUTION_TASK',
          agent: nextTask.agent,
          task: nextTask.path,
          summary: `Dispatching task '${nextTask.id}' to agent '@${nextTask.agent}'.`,
          newStatus: 'EXECUTION_IN_PROGRESS',
        };
      } else {
         if (state.project_manifest?.tasks?.every(t => t.status === 'COMPLETED')) {
            await stateManager.updateStatus('PROJECT_COMPLETE');
            return { type: 'WAITING', summary: 'All tasks completed. Project is finished.' };
         }
         return { type: 'WAITING', summary: 'Execution phase, but no pending tasks found.' };
      }

    case 'PROJECT_COMPLETE':
    case 'EXECUTION_HALTED':
    case 'EXECUTION_PAUSED':
    default:
      return {
        type: 'WAITING',
        summary: `System is in '${state.project_status}' state. No action will be taken.`,
      };
  }
}

function findNextPendingTask(manifest) {
  if (!manifest || !manifest.tasks) {
    return null;
  }

  for (const task of manifest.tasks) {
    if (task.status === 'PENDING') {
      const dependenciesMet =
        !task.dependencies ||
        task.dependencies.every(depId => {
          const depTask = manifest.tasks.find(t => t.id === depId);
          return depTask && depTask.status === 'COMPLETED';
        });

      if (dependenciesMet) {
        return task;
      }
    }
  }
  return null;
}

module.exports = { getNextAction };
```---
### File: `cli/index.js` (MODIFY)
```javascript
#!/usr/bin/env node

const { Command } = require('commander');
const installer = require('../installer/install');
const { runBuilder } = require('../builder/prompt_builder');
const stateManager = require('../engine/state_manager');

const program = new Command();

program
  .name('stigmergy')
  .description('The command-line interface for the Pheromind Autonomous Development System.')
  .version(require('../package.json').version);

program
  .command('install')
  .description('Installs the Pheromind knowledge base (.stigmergy-core) and configures the project.')
  .action(async () => {
    await installer.run();
  });

program
  .command('start')
  .description('Starts the local Pheromind AI Engine as a background service.')
  .action(() => {
    console.log('Starting Pheromind Engine...');
    // In a real CLI, you'd use a process manager like pm2 to run this in the background.
    // For simplicity, we just require it, which starts the server.
    require('../engine/server.js');
    console.log('Engine started. Use your configured IDE to interact with agents.');
  });

program
  .command('build')
  .description('Builds self-contained prompt files for use in Web UIs (e.g., Gemini, Claude).')
  .option('-a, --agent <agentId>', 'Build a single agent bundle by its ID (e.g., mary).')
  .option('--all', 'Build all agents.')
  .action(async (options) => {
    await runBuilder(options);
  });

async function main() {
    await program.parseAsync(process.argv);
}

main();
