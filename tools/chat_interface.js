import { createStructuredResponse } from './core_tools.js';
import stateManager from '../src/infrastructure/state/GraphStateManager.js';

// --- Command Identification Functions ---
// These helpers make the logic clear and prevent errors.

function isHelpCommand(cmd) {
  return cmd.includes('help') || cmd.includes('what can');
}

function isSetupCommand(cmd) {
  return cmd.includes('setup') || cmd.includes('install') || cmd.includes('configure');
}

function isHealthCommand(cmd) {
  return cmd.includes('health') || cmd.includes('status');
}

function isValidationCommand(cmd) {
  return cmd.includes('validate');
}

function isDevelopmentCommand(cmd) {
  // This should be the fallback, but we can define some keywords.
  return cmd.includes('create') || cmd.includes('build') || cmd.includes('implement') || cmd.includes('develop');
}

// --- Main Tool Function ---

export async function process_chat_command({ command }) {
  const normalizedCommand = command.toLowerCase().trim();
  console.log(`Processing command: ${normalizedCommand}`);

  if (isHealthCommand(normalizedCommand)) {
    console.log("Command is health related.");
    return createStructuredResponse({
      status: 'complete',
      message: 'System is healthy.',
    });
  }

  if (isHelpCommand(normalizedCommand) || isSetupCommand(normalizedCommand) || isValidationCommand(normalizedCommand)) {
    console.log("Command is help, setup, or validation related.");
     return createStructuredResponse({
      status: 'complete',
      message: 'This command type is recognized but not fully implemented in this test version.',
    });
  }
  
  if (isDevelopmentCommand(normalizedCommand)) {
    console.log("Command is development related.");
    await stateManager.initializeProject(command);
    return createStructuredResponse({
      status: 'in_progress',
      message: `Received new goal: "${command}". Kicking off the autonomous engine.`, 
    });
  }

  console.log("Command is unknown, asking for clarification.");
  return createStructuredResponse({
    status: 'clarification_needed',
    message: `I'm not sure how to handle the command: "${command}". Please try rephrasing, or type "help".`,
  });
}