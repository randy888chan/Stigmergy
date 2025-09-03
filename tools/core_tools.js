import fs from "fs-extra";
import path from "path";
import coreBackup from "../services/core_backup.js";
import { validateAgents } from "../cli/commands/validate.js";

// ===================================================================
// == Guardian Tools (@guardian) - High Privilege, System Modifying ==
// ===================================================================

/**
 * Creates a new backup of the .stigmergy-core directory.
 * @returns {Promise<string>} Confirmation message.
 */
export async function backup() {
  console.log("[Core Tools] Guardian is creating a system backup...");
  const backupPath = await coreBackup.autoBackup();
  if (backupPath) {
    return `Core backup created successfully at ${backupPath}`;
  }
  throw new Error("Core backup failed.");
}

/**
 * Validates the integrity of all agent definitions in the core.
 * @returns {Promise<string>} Confirmation or error message.
 */
export async function validate() {
  console.log("[Core Tools] Guardian is validating system integrity...");
  const result = await validateAgents();
  if (result.success) {
    return "Core agent validation passed successfully.";
  }
  throw new Error(`Core validation failed: ${result.error}`);
}

/**
 * Applies a patch (writes content) to a file within the .stigmergy-core.
 * This is a highly privileged operation.
 * @param {object} args
 * @param {string} args.filePath - Relative path within .stigmergy-core.
 * @param {string} args.content - The new content for the file.
 * @returns {Promise<string>} Confirmation message.
 */
export async function applyPatch({ filePath, content }) {
  console.log(`[Core Tools] Guardian is applying a patch to: ${filePath}`);
  const corePath = path.join(process.cwd(), ".stigmergy-core");
  const safePath = path.join(corePath, filePath);

  // Security Check: Ensure the path is genuinely inside the core.
  if (!safePath.startsWith(corePath)) {
      throw new Error(`Security violation: Path traversal attempt on core file system: ${filePath}`);
  }

  await fs.writeFile(safePath, content);
  return `Patch applied successfully to ${filePath}.`;
}

/**
 * Restores the .stigmergy-core from the latest backup.
 * @returns {Promise<string>} Confirmation message.
 */
export async function restore() {
    if (await coreBackup.restoreLatest()) {
        return "Core restored successfully from latest backup.";
    }
    throw new Error("Core restore failed.");
}

// System Control Tools (Factory)
export function createSystemControlTools(engine) {
  return {
    start_project: async ({ goal }) => {
      await engine.stateManager.initializeProject(goal);
      engine.start(); // This won't re-run the server, just the loop
      return `Project initialized with goal: "${goal}". Engine loop is active.`;
    },
    pause_engine: async () => {
      await engine.stop("Paused by user command.");
      return "Stigmergy engine loop has been paused.";
    },
    resume_engine: async () => {
      engine.start();
      return "Stigmergy engine loop is resuming.";
    },
    get_status: async () => {
      const state = await engine.stateManager.getState();
      return `Current project status: ${state.project_status}`;
    },
  };
}

// Enhanced System Control Tools with Structured Communication

/**
 * Generate structured status response
 */
export function createStructuredResponse({ 
  status, 
  message, 
  progress = 0, 
  files_modified = [], 
  files_created = [],
  next_action = '',
  requires_approval = false,
  execution_method = 'internal',
  brief_available = false,
  error_details = null 
}) {
  const response = {
    status,
    message,
    progress: Math.min(100, Math.max(0, progress)),
    files_modified: Array.isArray(files_modified) ? files_modified : [],
    files_created: Array.isArray(files_created) ? files_created : [],
    next_action,
    requires_approval,
    execution_method,
    brief_available,
    timestamp: new Date().toISOString()
  };
  
  if (error_details) {
    response.error_details = error_details;
  }
  
  return response;
}

/**
 * Analyze task and determine execution strategy
 */
export async function analyzeTaskExecutionStrategy({ task, context = '', available_briefs = [] }) {
  console.log('[System] Analyzing task execution strategy');
  
  try {
    // Check for existing Technical Implementation Brief
    const briefsDir = path.join(process.cwd(), 'docs', 'briefs');
    let briefsFound = [];
    
    if (await fs.pathExists(briefsDir)) {
      const briefFiles = await fs.readdir(briefsDir);
      briefsFound = briefFiles.filter(f => f.endsWith('.md'));
    }
    
    // Analyze task complexity
    const taskLower = task.toLowerCase();
    const isComplex = taskLower.includes('algorithm') || taskLower.includes('optimization') || 
                     taskLower.includes('mathematical') || taskLower.includes('performance');
    const isStandard = taskLower.includes('crud') || taskLower.includes('form') || 
                      taskLower.includes('button') || taskLower.includes('component');
    const hasIntegration = taskLower.includes('integrate') || taskLower.includes('connect') || 
                          taskLower.includes('api') || context.includes('existing');
    
    // Determine optimal execution method
    let recommendedMethod = 'internal';
    let reasoning = '';
    
    if (briefsFound.length > 0 && hasIntegration) {
      recommendedMethod = 'internal';
      reasoning = 'Complex integration with available reference patterns - using enhanced internal dev';
    } else if (isComplex) {
      recommendedMethod = 'qwen-cli';
      reasoning = 'Complex algorithmic task detected - routing to Qwen CLI for optimization';
    } else if (isStandard) {
      recommendedMethod = 'gemini-cli';
      reasoning = 'Standard implementation - using Gemini CLI for fast delivery';
    } else {
      recommendedMethod = 'internal';
      reasoning = 'Default to internal dev for custom business logic';
    }
    
    return createStructuredResponse({
      status: 'thinking',
      message: 'Task analysis complete - preparing execution plan',
      progress: 20,
      execution_method: recommendedMethod,
      brief_available: briefsFound.length > 0,
      next_action: `Will use ${recommendedMethod} execution method. ${reasoning}`
    });
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'Task analysis failed',
      error_details: error.message
    });
  }
}