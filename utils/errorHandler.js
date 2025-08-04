// utils/errorHandler.js
export class EnhancedError extends Error {
  constructor(message, type, remediation) {
    super(message);
    this.type = type;
    this.remediation = remediation;
  }
}

export function withRetry(fn, maxRetries = 3, delay = 1000) {
  return async (...args) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn(...args);
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise((res) => setTimeout(res, delay * (i + 1)));
      }
    }
  };
}
