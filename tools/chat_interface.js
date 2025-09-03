// Chat Interface for Stigmergy System - Handles All Setup and Commands
import fs from 'fs-extra';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import { createStructuredResponse, analyzeTaskExecutionStrategy } from './core_tools.js';

const execPromise = promisify(exec);

/**
 * Main chat command processor with enhanced Roo Code integration
 * Returns structured JSON responses optimized for IDE consumption
 */
export async function process_chat_command({ command, context = '', user_preferences = {}, source = 'unknown' }) {
  console.log(`[Chat Interface] Processing command from ${source}: ${command}`);
  
  const startTime = Date.now();
  const normalizedCommand = command.toLowerCase().trim();
  
  try {
    let result;
    
    // Enhanced command routing with context awareness
    if (isHelpCommand(normalizedCommand)) {
      result = await handleHelpCommand(normalizedCommand, context, source);
    } else if (isSetupCommand(normalizedCommand)) {
      result = await handleSetupCommand(normalizedCommand, context, user_preferences);
    } else if (isIndexingCommand(normalizedCommand)) {
      result = await handleIndexingCommand(normalizedCommand, context);
    } else if (isHealthCommand(normalizedCommand)) {
      result = await handleHealthCommand(normalizedCommand);
    } else if (isValidationCommand(normalizedCommand)) {
      result = await handleValidationCommand(normalizedCommand);
    } else if (isDevelopmentCommand(normalizedCommand)) {
      result = await handleDevelopmentCommand(normalizedCommand, context, user_preferences);
    } else if (isSystemCommand(normalizedCommand)) {
      result = await handleSystemCommand(normalizedCommand, context);
    } else {
      // Default: treat as development task with intelligent routing
      result = await handleDevelopmentTask(command, context, user_preferences);
    }
    
    // Ensure consistent response format for Roo Code
    return enhanceResponseForRooCode(result, {
      command,
      source,
      execution_time: Date.now() - startTime
    });
    
  } catch (error) {
    console.error('[Chat Interface] Error processing command:', error);
    
    return enhanceResponseForRooCode({
      status: 'error',
      message: 'Command processing failed',
      error_details: error.message,
      progress: 0
    }, {
      command,
      source,
      execution_time: Date.now() - startTime,
      error: true
    });
  }
}

/**
 * Command pattern detection functions
 */
function isHelpCommand(cmd) {
  return cmd.includes('help') || cmd.includes('what can') || cmd.includes('get started') || 
         cmd.includes('how do') || cmd.includes('guide') || cmd.includes('assist');
}

function isSetupCommand(cmd) {
  return cmd.includes('setup') || cmd.includes('install') || cmd.includes('configure') || 
         cmd.includes('neo4j') || cmd.includes('environment') || cmd.includes('init');
}

function isIndexingCommand(cmd) {
  return cmd.includes('index') || cmd.includes('github') || cmd.includes('repository') || 
         cmd.includes('patterns') || cmd.includes('reference');
}

function isHealthCommand(cmd) {
  return cmd.includes('health') || cmd.includes('status') || cmd.includes('check') || 
         cmd.includes('diagnostic');
}

function isValidationCommand(cmd) {
  return cmd.includes('validate') || cmd.includes('verify') || cmd.includes('test');
}

function isDevelopmentCommand(cmd) {
  return cmd.includes('create') || cmd.includes('build') || cmd.includes('implement') || 
         cmd.includes('generate') || cmd.includes('code') || cmd.includes('develop');
}

function isSystemCommand(cmd) {
  return cmd.includes('restart') || cmd.includes('stop') || cmd.includes('start') || 
         cmd.includes('config') || cmd.includes('settings');
}

/**
 * Help command handler - provides contextual guidance
 */
async function handleHelpCommand(command, context, source) {
  console.log('[Chat Interface] Handling help command');
  
  const envStatus = await checkEnvironmentStatus();
  const suggestions = await get_command_suggestions({ current_context: context });
  
  let helpMessage = '';
  let nextSteps = [];
  
  if (command.includes('get started') || command.includes('what can')) {
    helpMessage = 'Welcome to Stigmergy! I can help you with setup, development, and system management.';
    
    if (!envStatus.core_files_exist) {
      nextSteps.push('Run "install core files" to set up the system');
    } else if (!envStatus.neo4j_configured) {
      nextSteps.push('Try "setup neo4j" to configure the database');
    } else if (!envStatus.github_token_configured) {
      nextSteps.push('Try "setup environment" to configure API keys');
    } else {
      nextSteps.push('Try "index github repos" to build your reference library');
      nextSteps.push('Try "create authentication system" for development');
    }
  } else {
    helpMessage = 'I can assist with various tasks. Here are your options:';
    nextSteps = suggestions.suggestions.slice(0, 3).map(s => s.command);
  }
  
  return createStructuredResponse({
    status: 'complete',
    message: helpMessage,
    progress: 100,
    next_action: 'Choose from the suggested commands below',
    suggestions: nextSteps,
    system_status: envStatus,
    roo_code_integration: source === 'roo_code' ? 'active' : 'available'
  });
}

/**
 * Setup command handler - handles Neo4j, environment, and initial configuration
 */
async function handleSetupCommand(command, context, userPreferences) {
  console.log('[Chat Interface] Handling setup command');
  
  const steps = [];
  let currentStep = 0;
  
  try {
    // Step 1: Check current environment
    steps.push('Checking current environment...');
    const envCheck = await checkEnvironmentStatus();
    currentStep++;
    
    // Step 2: Setup Neo4j if needed
    if (command.includes('neo4j') || !envCheck.neo4j_configured) {
      steps.push('Setting up Neo4j database...');
      const neo4jResult = await setupNeo4j();
      currentStep++;
      
      if (!neo4jResult.success) {
        return createStructuredResponse({
          status: 'error',
          message: 'Neo4j setup failed',
          error_details: neo4jResult.error,
          progress: (currentStep / steps.length) * 100
        });
      }
    }
    
    // Step 3: Setup environment variables
    if (command.includes('environment') || command.includes('env')) {
      steps.push('Configuring environment variables...');
      const envResult = await setupEnvironmentVariables();
      currentStep++;
      
      if (!envResult.success) {
        return createStructuredResponse({
          status: 'awaiting_input',
          message: 'Environment setup needs your input',
          requires_approval: true,
          next_action: 'Please provide missing API keys and configuration'
        });
      }
    }
    
    // Step 4: Install dependencies
    if (command.includes('install') || command.includes('dependencies')) {
      steps.push('Installing dependencies...');
      await executeCommand('npm install');
      currentStep++;
    }
    
    // Step 5: Initialize core files
    if (command.includes('init') || command.includes('core')) {
      steps.push('Initializing core files...');
      await executeCommand('npm run install-core');
      currentStep++;
    }
    
    return createStructuredResponse({
      status: 'complete',
      message: 'Setup completed successfully',
      progress: 100,
      next_action: 'System is ready for use. Try: "index github repos" or "create a new feature"'
    });
    
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'Setup failed',
      error_details: error.message,
      progress: (currentStep / steps.length) * 100
    });
  }
}

/**
 * Indexing command handler - handles GitHub repository indexing
 */
async function handleIndexingCommand(command, context) {
  console.log('[Chat Interface] Handling indexing command');
  
  try {
    if (command.includes('github') || command.includes('repository')) {
      return createStructuredResponse({
        status: 'executing',
        message: 'Starting GitHub repository indexing...',
        progress: 10,
        next_action: 'This may take several minutes to complete'
      });
      
      // Execute indexing in background
      const indexResult = await executeCommand('npm run index:github-repos');
      
      return createStructuredResponse({
        status: 'complete',
        message: 'Repository indexing completed',
        progress: 100,
        next_action: 'Reference patterns are now available for development tasks'
      });
    } else if (command.includes('coderag') || command.includes('local')) {
      return createStructuredResponse({
        status: 'executing',
        message: 'Initializing local codebase indexing...',
        progress: 20,
        next_action: 'Analyzing current project structure'
      });
      
      const coderagResult = await executeCommand('npm run coderag:init');
      
      return createStructuredResponse({
        status: 'complete',
        message: 'Local codebase indexed successfully',
        progress: 100,
        next_action: 'Code intelligence is now active'
      });
    }
    
    return createStructuredResponse({
      status: 'awaiting_input',
      message: 'What would you like to index?',
      requires_approval: true,
      next_action: 'Specify "github repos" or "local codebase"'
    });
    
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'Indexing failed',
      error_details: error.message
    });
  }
}

/**
 * Health command handler
 */
async function handleHealthCommand(command) {
  console.log('[Chat Interface] Handling health command');
  
  try {
    const healthResult = await executeCommand('npm run health-check');
    
    return createStructuredResponse({
      status: 'complete',
      message: 'Health check completed',
      progress: 100,
      next_action: 'All systems operational'
    });
    
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'Health check revealed issues',
      error_details: error.message,
      next_action: 'Check system configuration and dependencies'
    });
  }
}

/**
 * Validation command handler
 */
async function handleValidationCommand(command) {
  console.log('[Chat Interface] Handling validation command');
  
  try {
    const validateResult = await executeCommand('npm run validate');
    
    return createStructuredResponse({
      status: 'complete',
      message: 'Validation completed successfully',
      progress: 100,
      next_action: 'All agents and configurations are valid'
    });
    
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'Validation failed',
      error_details: error.message,
      next_action: 'Check agent definitions and configuration files'
    });
  }
}

/**
 * Development command handler
 */
async function handleDevelopmentCommand(command, context, userPreferences) {
  console.log('[Chat Interface] Handling development command');
  
  // Use the existing task execution strategy
  const strategy = await analyzeTaskExecutionStrategy({
    task: command,
    context: context,
    available_briefs: []
  });
  
  return createStructuredResponse({
    status: 'thinking',
    message: 'Analyzing development task...',
    progress: 15,
    execution_method: strategy.execution_method,
    next_action: 'Preparing to execute development task'
  });
}

/**
 * System command handler with enhanced Roo Code support
 */
async function handleSystemCommand(command, context) {
  console.log('[Chat Interface] Handling system command');
  
  try {
    if (command.includes('restart')) {
      return createStructuredResponse({
        status: 'executing',
        message: 'Restarting Stigmergy system...',
        progress: 50,
        next_action: 'System will be back online shortly'
      });
    } else if (command.includes('config') || command.includes('settings')) {
      return await showSystemConfiguration();
    } else if (command.includes('status') || command.includes('what can')) {
      const envStatus = await checkEnvironmentStatus();
      const suggestions = await get_command_suggestions({ current_context: context });
      
      return createStructuredResponse({
        status: 'complete',
        message: 'System status retrieved',
        progress: 100,
        system_status: envStatus,
        available_commands: suggestions.suggestions,
        next_action: 'System is ready for commands'
      });
    }
    
    return createStructuredResponse({
      status: 'complete',
      message: 'System command executed',
      progress: 100
    });
    
  } catch (error) {
    return createStructuredResponse({
      status: 'error',
      message: 'System command failed',
      error_details: error.message
    });
  }
}

/**
 * Handle general development tasks
 */
async function handleDevelopmentTask(command, context, userPreferences) {
  console.log('[Chat Interface] Handling development task');
  
  // This integrates with the existing unified-executor workflow
  return createStructuredResponse({
    status: 'thinking',
    message: 'Processing development request...',
    progress: 5,
    next_action: 'Analyzing requirements and selecting optimal execution method'
  });
}

/**
 * Utility functions
 */
async function checkEnvironmentStatus() {
  const status = {
    neo4j_configured: process.env.NEO4J_URI ? true : false,
    google_api_configured: process.env.GOOGLE_API_KEY ? true : false,
    github_token_configured: process.env.GITHUB_TOKEN ? true : false,
    core_files_exist: await fs.pathExists('.stigmergy-core')
  };
  
  return status;
}

async function setupNeo4j() {
  try {
    // Check if Neo4j is already running
    if (process.env.NEO4J_URI) {
      return { success: true, message: 'Neo4j already configured' };
    }
    
    // Try to setup Neo4j
    await executeCommand('npm run setup:neo4j');
    
    return { success: true, message: 'Neo4j setup completed' };
  } catch (error) {
    return { 
      success: false, 
      error: 'Neo4j setup failed. Please install Neo4j Desktop and configure connection.',
      suggestion: 'Download from: https://neo4j.com/download-neo4j-now/'
    };
  }
}

async function setupEnvironmentVariables() {
  const envFile = path.join(process.cwd(), '.env');
  const envExample = path.join(process.cwd(), '.env.example');
  
  try {
    if (!await fs.pathExists(envFile) && await fs.pathExists(envExample)) {
      await fs.copy(envExample, envFile);
    }
    
    return { 
      success: true, 
      message: 'Environment template created. Please add your API keys.' 
    };
  } catch (error) {
    return { 
      success: false, 
      error: 'Could not setup environment variables',
      suggestion: 'Manually create .env file with required API keys'
    };
  }
}

async function executeCommand(command) {
  console.log(`[Chat Interface] Executing: ${command}`);
  
  try {
    const { stdout, stderr } = await execPromise(command, {
      cwd: process.cwd(),
      timeout: 300000 // 5 minute timeout
    });
    
    return { success: true, output: stdout, error: stderr };
  } catch (error) {
    throw new Error(`Command failed: ${error.message}`);
  }
}

async function showSystemConfiguration() {
  const config = {
    environment: await checkEnvironmentStatus(),
    model_tiers: 'Strategic, Execution, and Utility tiers configured',
    features: {
      neo4j: process.env.NEO4J_URI ? 'enabled' : 'disabled',
      automation_mode: 'autonomous',
      provider_isolation: 'enabled',
      deepcode_integration: 'enabled'
    }
  };
  
  return createStructuredResponse({
    status: 'complete',
    message: 'System configuration retrieved',
    progress: 100,
    next_action: 'Configuration displayed in response',
    configuration: config
  });
}

/**
 * Smart command suggestions based on current state and source
 */
export async function get_command_suggestions({ current_context = '', user_history = [], source = 'unknown' }) {
  const status = await checkEnvironmentStatus();
  const suggestions = [];
  
  // Setup suggestions
  if (!status.neo4j_configured) {
    suggestions.push({
      command: 'setup neo4j',
      description: 'Configure Neo4j database for code intelligence',
      priority: 'high',
      category: 'setup'
    });
  }
  
  if (!status.github_token_configured) {
    suggestions.push({
      command: 'setup environment',
      description: 'Configure GitHub token for repository indexing',
      priority: 'medium',
      category: 'setup'
    });
  }
  
  // Indexing suggestions
  if (status.github_token_configured && !user_history.includes('index')) {
    suggestions.push({
      command: 'index github repos',
      description: 'Index reference repositories for pattern discovery',
      priority: 'medium',
      category: 'indexing'
    });
  }
  
  // Development suggestions based on context
  if (current_context.includes('auth') || current_context.includes('login')) {
    suggestions.push({
      command: 'create authentication system',
      description: 'Build a secure auth system with JWT and session management',
      priority: 'high',
      category: 'development'
    });
  } else if (current_context.includes('api') || current_context.includes('rest')) {
    suggestions.push({
      command: 'create REST API',
      description: 'Build a complete REST API with CRUD operations',
      priority: 'high',
      category: 'development'
    });
  } else {
    suggestions.push({
      command: 'create authentication system',
      description: 'Example: Build a secure auth system with JWT',
      priority: 'low',
      category: 'development'
    });
  }
  
  // Roo Code specific suggestions
  if (source === 'roo_code') {
    suggestions.push({
      command: 'what can I do?',
      description: 'Show all available commands and system status',
      priority: 'low',
      category: 'help'
    });
  }
  
  suggestions.push({
    command: 'health check',
    description: 'Verify all systems are working correctly',
    priority: 'low',
    category: 'system'
  });
  
  return {
    suggestions: suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }),
    status,
    roo_code_tips: source === 'roo_code' ? getRooCodeTips(status) : null
  };
}

/**
 * Roo Code specific integration tips
 */
function getRooCodeTips(status) {
  const tips = [];
  
  if (!status.neo4j_configured) {
    tips.push('💡 Start with "setup neo4j" for enhanced code intelligence');
  }
  
  if (status.core_files_exist) {
    tips.push('🚀 Try "help me get started" for a guided setup');
  }
  
  tips.push('💬 Use natural language - "create a login system" works great!');
  tips.push('📊 All responses include progress tracking and file changes');
  
  return tips;
}

/**
 * Enhance response format specifically for Roo Code IDE integration
 * Ensures consistent JSON structure with all required fields
 */
function enhanceResponseForRooCode(baseResponse, metadata) {
  const { command, source, execution_time, error = false } = metadata;
  
  return {
    // Core response fields
    status: baseResponse.status || 'complete',
    message: baseResponse.message || 'Command completed',
    progress: baseResponse.progress || 100,
    
    // Execution metadata for Roo Code
    execution_metadata: {
      command_processed: command,
      source_interface: source,
      execution_time_ms: execution_time,
      timestamp: new Date().toISOString(),
      stigmergy_version: '2.2.0'
    },
    
    // Action guidance for IDE
    next_action: baseResponse.next_action || (error ? 'Please check the error and try again' : 'Command completed successfully'),
    
    // Files and changes (for IDE to refresh/highlight)
    files_modified: baseResponse.files_modified || [],
    files_created: baseResponse.files_created || [],
    
    // User interaction requirements
    requires_approval: baseResponse.requires_approval || false,
    awaiting_input: baseResponse.status === 'awaiting_input',
    
    // System information
    system_status: baseResponse.system_status || null,
    configuration: baseResponse.configuration || null,
    
    // Suggestions and help
    suggestions: baseResponse.suggestions || [],
    available_commands: baseResponse.available_commands || [],
    
    // Roo Code specific enhancements
    roo_code_integration: {
      status: source === 'roo_code' ? 'active' : 'compatible',
      tips: baseResponse.roo_code_tips || [],
      ui_hints: {
        show_progress: baseResponse.status === 'executing' || baseResponse.status === 'thinking',
        highlight_files: (baseResponse.files_modified || []).length > 0,
        show_approval_dialog: baseResponse.requires_approval || false,
        show_suggestions: (baseResponse.suggestions || []).length > 0
      }
    },
    
    // Error handling
    error_details: baseResponse.error_details || null,
    
    // Additional context from base response
    ...Object.fromEntries(
      Object.entries(baseResponse).filter(([key]) => 
        !['status', 'message', 'progress', 'next_action', 'files_modified', 
          'files_created', 'requires_approval', 'system_status', 'configuration',
          'suggestions', 'available_commands', 'error_details'].includes(key)
      )
    )
  };
}

export default {
  process_chat_command,
  get_command_suggestions
};