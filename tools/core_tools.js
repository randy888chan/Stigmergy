import fs from "fs-extra";
import path from "path";
import { CoreBackup } from "../services/core_backup.js";

// Create a default instance
const defaultCoreBackup = new CoreBackup();

// ===================================================================
// == Guardian Tools (@guardian) - High Privilege, System Modifying ==
// ===================================================================

/**
 * Creates a new backup of the .stigmergy-core directory.
 * @param {CoreBackup} coreBackupInstance - Optional CoreBackup instance for testing
 * @returns {Promise<string>} Confirmation message.
 */
export async function backup(coreBackupInstance = defaultCoreBackup) {
  console.log("[Core Tools] Guardian is creating a system backup...");
  const backupPath = await coreBackupInstance.autoBackup();
  if (backupPath) {
    return `Core backup created successfully at ${backupPath}`;
  }
  throw new Error("Core backup failed.");
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
 * @param {CoreBackup} coreBackupInstance - Optional CoreBackup instance for testing
 * @returns {Promise<string>} Confirmation message.
 */
export async function restore(coreBackupInstance = defaultCoreBackup) {
    if (await coreBackupInstance.restoreLatest()) {
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
    console.error('[System] Error analyzing task execution strategy:', error);
    return createStructuredResponse({
      status: 'error',
      message: 'Failed to analyze task execution strategy',
      progress: 0,
      execution_method: 'internal',
      brief_available: false,
      next_action: 'Will fallback to internal dev execution method',
      error_details: error.message
    });
  }
}

/**
 * Request user choice when multiple high-quality options are available
 * Particularly useful for @reference-architect when multiple patterns match
 */
export async function request_user_choice({ 
  title, 
  description, 
  options, 
  context = '', 
  default_option = null, 
  timeout_seconds = 300 
}) {
  console.log(`[Core Tools] Requesting user choice: ${title}`);
  
  // Validate options format
  if (!Array.isArray(options) || options.length === 0) {
    throw new Error('Options must be a non-empty array');
  }
  
  // Ensure each option has required fields
  const validatedOptions = options.map((option, index) => {
    if (typeof option === 'string') {
      return {
        id: `option_${index}`,
        label: option,
        description: option,
        value: option
      };
    }
    
    return {
      id: option.id || `option_${index}`,
      label: option.label || option.name || `Option ${index + 1}`,
      description: option.description || option.label || `Option ${index + 1}`,
      value: option.value || option,
      metadata: option.metadata || {},
      recommendation: option.recommendation || null
    };
  });
  
  // Create structured choice request
  const choiceRequest = {
    type: 'user_choice_request',
    title,
    description,
    options: validatedOptions,
    context,
    default_option: default_option || validatedOptions[0]?.id,
    timestamp: new Date().toISOString(),
    timeout_seconds,
    
    // UI hints for different interfaces
    ui_hints: {
      roo_code: {
        show_as_dialog: true,
        highlight_recommended: !!validatedOptions.find(o => o.recommendation),
        allow_preview: true
      },
      cli: {
        show_as_menu: true,
        numbered_options: true
      },
      web: {
        show_as_cards: true,
        enable_comparison: true
      }
    }
  };
  
  // For now, return the choice request structure
  // In production, this would integrate with the actual UI system
  return {
    status: 'awaiting_user_choice',
    choice_request: choiceRequest,
    message: `Please choose from ${validatedOptions.length} available options`,
    requires_user_interaction: true,
    
    // Helper method to simulate choice for testing
    simulate_choice: (choiceId) => {
      const selectedOption = validatedOptions.find(opt => opt.id === choiceId);
      if (!selectedOption) {
        throw new Error(`Invalid choice ID: ${choiceId}`);
      }
      
      return {
        status: 'choice_selected',
        selected_option: selectedOption,
        message: `Selected: ${selectedOption.label}`,
        timestamp: new Date().toISOString()
      };
    }
  };
}

/**
 * Export all functions as system tools namespace
 */
export const system = {
  request_user_choice,
  analyzeTaskExecutionStrategy,
  createStructuredResponse
};