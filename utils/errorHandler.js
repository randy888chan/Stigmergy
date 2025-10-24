import chalk from "chalk";
import { localizeError } from './localization.js';

export const ERROR_TYPES = {
  DB_CONNECTION: "DatabaseConnectionError",
  TOOL_EXECUTION: "ToolExecutionError",
  AGENT_FAILURE: "AgentFailure",
  PERMISSION_DENIED: "PermissionDenied",
  SECURITY: "SecurityError",
  CONFIGURATION: "ConfigurationError",
  TRANSIENT: "TransientError"
};

export class OperationalError extends Error {
  constructor(message, type, remediationSteps = []) {
    super(message);
    this.name = "OperationalError";
    this.type = type;
    this.remediationSteps = remediationSteps;
    this.isOperational = true;
  }
}

class BudgetExceededError extends OperationalError {
    constructor(message) {
        super(message);
        this.name = 'BudgetExceededError';
    }
}

class ErrorHandler {
  process(error, context = {}) {
    if (error instanceof OperationalError) return error;
    
    let type = ERROR_TYPES.AGENT_FAILURE;
    let message = error.message;
    let remediation = [];

    if (message.includes("Neo.ClientError") || message.includes("ECONNREFUSED")) {
      type = ERROR_TYPES.DB_CONNECTION;
      remediation = ["Check if Neo4j Desktop is running.", "Verify .env credentials (NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD).", "Run 'npm run test:neo4j' to diagnose."];
    } else if (message.toLowerCase().includes('api key')) {
        type = ERROR_TYPES.CONFIGURATION;
        remediation = ["Check that the required API key is set in your .env file.", "Ensure the correct environment variables are loaded (e.g., GOOGLE_API_KEY, OPENAI_API_KEY)."];
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

export { BudgetExceededError };
export default new ErrorHandler();