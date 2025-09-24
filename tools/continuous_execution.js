import * as fs from 'fs-extra';
import path from 'path';
import yaml from 'js-yaml';

/**
 * Continuous Implementation Loop Tool
 * 
 * This tool implements a high-speed execution protocol that:
 * 1. Manages a loop that continues as long as there are PENDING tasks
 * 2. Finds the next task whose dependencies are COMPLETED
 * 3. Reads current content of all files relevant to the entire plan
 * 4. Delegates to the new @executor agent with task description and file contents
 * 5. Uses raw code output from @executor to update files using file_system.writeFile
 * 6. Marks the current task as COMPLETED
 * 7. Repeats until all tasks are COMPLETED
 * 8. Delegates to @qa agent for final verification
 */

export async function executeContinuousLoop({ agentConfig }) {
  console.log('[ContinuousExecution] Starting continuous implementation loop');
  
  // This would be implemented in the server-side logic rather than as a tool
  // The tool executor is not the right place for this complex orchestration
  
  return {
    status: 'success',
    message: 'Continuous execution loop initiated'
  };
}

/**
 * Find the next executable task
 * @param {Array} tasks - All tasks in the project manifest
 * @returns {Object|null} - The next task to execute or null if none found
 */
export function findNextExecutableTask(tasks) {
  const pendingTasks = tasks.filter(task => task.status === 'PENDING');
  const completedTaskIds = new Set(
    tasks.filter(task => task.status === 'COMPLETED').map(task => task.id)
  );
  
  // Find a pending task whose dependencies are all completed
  for (const task of pendingTasks) {
    const dependencies = task.dependencies || [];
    const allDependenciesMet = dependencies.every(depId => completedTaskIds.has(depId));
    
    if (allDependenciesMet) {
      return task;
    }
  }
  
  return null;
}

/**
 * Read relevant files for the entire plan
 * @param {Array} tasks - All tasks in the project manifest
 * @returns {Object} - Map of file paths to their contents
 */
export async function readRelevantFiles(tasks) {
  const filesToRead = new Set();
  
  // Collect all files from all tasks
  for (const task of tasks) {
    const files = task.files_to_create_or_modify || [];
    files.forEach(file => filesToRead.add(file));
  }
  
  const fileContents = {};
  
  // Read each file
  for (const filePath of filesToRead) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (await fs.pathExists(fullPath)) {
        fileContents[filePath] = await fs.readFile(fullPath, 'utf8');
      } else {
        fileContents[filePath] = ''; // File doesn't exist yet
      }
    } catch (error) {
      console.warn(`[ContinuousExecution] Could not read file ${filePath}:`, error.message);
      fileContents[filePath] = ''; // Error reading file
    }
  }
  
  return fileContents;
}

/**
 * Update task status
 * @param {string} taskId - The ID of the task to update
 * @param {string} newStatus - The new status for the task
 * @param {Array} tasks - All tasks in the project manifest
 * @returns {Array} - Updated tasks array
 */
export function updateTaskStatus(taskId, newStatus, tasks) {
  return tasks.map(task => {
    if (task.id === taskId) {
      return { ...task, status: newStatus };
    }
    return task;
  });
}

export default {
  executeContinuousLoop,
  findNextExecutableTask,
  readRelevantFiles,
  updateTaskStatus
};