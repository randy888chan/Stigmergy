import chalk from "chalk";

export const ERROR_TYPES = {
  DB_CONNECTION: "DatabaseConnectionError",
  TOOL_EXECUTION: "ToolExecutionError",
  AGENT_FAILURE: "AgentFailure",
  PERMISSION_DENIED: "PermissionDenied",
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

class ErrorHandler {
  process(error, context = {}) {
    if (error instanceof OperationalError) return error;
    let type = ERROR_TYPES.AGENT_FAILURE;
    if (error.message.includes("Neo.ClientError")) type = ERROR_TYPES.DB_CONNECTION;
    console.error(chalk.red(`[ErrorHandler] Error: ${error.message}`));
    return new OperationalError(error.message, type);
  }
}

export default new ErrorHandler();
