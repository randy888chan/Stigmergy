// utils/errorHandler.js
export class OperationalError extends Error {
  constructor(message, type, remediation) {
    super(message);
    this.name = "OperationalError";
    this.type = type;
    this.remediation = remediation;
    this.isOperational = true;
  }
}

export const ERROR_TYPES = {
  DB_CONNECTION: "DatabaseConnectionError",
  TOOL_EXECUTION: "ToolExecutionError",
  AGENT_FAILURE: "AgentFailure",
  PERMISSION_DENIED: "PermissionDenied",
};

export const remediationMap = {
  [ERROR_TYPES.DB_CONNECTION]:
    "1. Check Neo4j is running\n2. Verify credentials in .env\n3. Run `npm run test:neo4j`",
  [ERROR_TYPES.TOOL_EXECUTION]:
    "1. Check tool parameters\n2. Verify API keys\n3. Retry with `@system retry`",
  [ERROR_TYPES.AGENT_FAILURE]:
    "1. Check agent requirements\n2. Review state.json\n3. Contact support",
  [ERROR_TYPES.PERMISSION_DENIED]:
    "1. Verify agent permissions\n2. Check manifest.yml\n3. Update tool access",
};

export function withRetry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000 } = options;

  return async (...args) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        if (attempt === maxRetries || !error.isRetryable) {
          throw error;
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };
}
