// engine/error_handling.js

import { localizeError } from '../utils/localization.js'; // Assuming you might use this later
import chalk from 'chalk';

export const ERROR_TYPES = {
  DB_CONNECTION: "DatabaseConnectionError",
  TOOL_EXECUTION: "ToolExecutionError",
  AGENT_FAILURE: "AgentFailure",
  PERMISSION_DENIED: "PermissionDenied",
  SECURITY: "SecurityError",
  CONFIGURATION: "ConfigurationError",
  TRANSIENT: "TransientError"
};

/**
 * A custom error class for operational errors within Stigmergy.
 */
export class OperationalError extends Error {
  constructor(message, type, remediationSteps = []) {
    super(message);
    this.name = "OperationalError";
    this.type = type;
    this.remediationSteps = remediationSteps;
    this.isOperational = true;
  }
}

/**
 * Centralized error handling and classification for Stigmergy.
 */
class ErrorHandler {
  /**
   * Processes an error, classifies it, and provides a structured response.
   * @param {Error} error - The error object.
   * @param {object} context - Additional context (e.g., { agentId, toolName }).
   * @returns {OperationalError} - A structured operational error.
   */
  process(error, context = {}) {
    if (error instanceof OperationalError) {
      return error; // The error is already processed.
    }

    // Classify the error based on its properties and context
    let type = ERROR_TYPES.AGENT_FAILURE;
    let message = error.message;
    let remediation = [];

    if (message.includes("Neo.ClientError") || message.includes("ECONNREFUSED")) {
      type = ERROR_TYPES.DB_CONNECTION;
      remediation = ["Check if Neo4j Desktop is running.", "Verify .env credentials (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).", "Run 'npm run test:neo4j' to diagnose."];
    } else if (context.toolName) {
      type = ERROR_TYPES.TOOL_EXECUTION;
      remediation = [`Review the parameters passed to the '${context.toolName}' tool.`, "Check for required API keys in the .env file."];
    } else if (message.includes("permission denied")) {
        type = ERROR_TYPES.PERMISSION_DENIED;
        remediation = [`Check the 'tools' list for agent '${context.agentId}' in its definition file.`];
    }

    console.error(chalk.red(`[ErrorHandler] Processed Error [${type}] for Agent [${context.agentId || 'unknown'}]`));
    console.error(chalk.red(`  -> Original Message: ${message}`));

    return new OperationalError(message, type, remediation);
  }
}

export default new ErrorHandler();
