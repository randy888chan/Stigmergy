/**
 * Centralized error handling system for Stigmergy
 * Provides consistent error classification, recovery, and reporting
 */

class ErrorHandler {
  constructor() {
    this.errorPatterns = new Map();
    this.recoveryStrategies = {
      TRANSIENT: this._handleTransientError.bind(this),
      CONFIGURATION: this._handleConfigurationError.bind(this),
      DESIGN: this._handleDesignError.bind(this),
      CRITICAL: this._handleCriticalError.bind(this),
    };
  }

  /**
   * Process an error report from any agent
   */
  async processError(errorReport) {
    // Classify the error
    const classification = this.classifyError(errorReport);

    // Record the pattern
    this._recordPattern(classification, errorReport);

    // Attempt recovery
    const recoveryResult = await this.attemptRecovery(classification, errorReport);

    // Return complete handling result
    return {
      classification,
      recoveryResult,
      escalationNeeded: recoveryResult.escalationNeeded,
    };
  }

  /**
   * Classify error based on patterns and context
   */
  classifyError(errorReport) {
    // Check for known patterns first
    for (const [pattern, classification] of this.errorPatterns) {
      if (errorReport.message.includes(pattern)) {
        return classification;
      }
    }

    // Apply heuristic classification
    if (errorReport.message.includes("timeout") || errorReport.message.includes("ECONNREFUSED")) {
      return "TRANSIENT";
    }

    if (errorReport.message.includes("config") || errorReport.message.includes("ENV")) {
      return "CONFIGURATION";
    }

    if (errorReport.message.includes("architecture") || errorReport.message.includes("design")) {
      return "DESIGN";
    }

    return "CRITICAL";
  }

  /**
   * Attempt recovery based on error classification
   */
  async attemptRecovery(classification, errorReport) {
    const strategy = this.recoveryStrategies[classification];
    if (!strategy) return { success: false, message: "No recovery strategy available" };

    return strategy(errorReport);
  }

  /**
   * Handle transient errors (network issues, temporary failures)
   */
  async _handleTransientError(errorReport) {
    // Implement exponential backoff
    const maxRetries = 3;
    for (let i = 0; i < maxRetries; i++) {
      try {
        // Allow the agent to retry its operation
        if (errorReport.retryCallback) {
          await errorReport.retryCallback();
          return {
            success: true,
            message: `Recovered after ${i + 1} attempts`,
            recoveryType: "AUTOMATIC_RETRY",
          };
        }
      } catch (retryError) {
        // Wait longer with each attempt
        const delay = 500 * Math.pow(2, i);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // If all retries failed, try fallback implementation
    if (errorReport.fallbackCallback) {
      try {
        await errorReport.fallbackCallback();
        return {
          success: true,
          message: "Recovered using fallback implementation",
          recoveryType: "FALLBACK_IMPLEMENTATION",
        };
      } catch (fallbackError) {
        // Continue to escalation
      }
    }

    return {
      success: false,
      message: "Failed to recover from transient error",
      escalationNeeded: true,
    };
  }

  /**
   * Handle configuration errors
   */
  _handleConfigurationError(errorReport) {
    // Suggest specific configuration fixes
    const suggestions = [];

    if (errorReport.message.includes("NEO4J_URI")) {
      suggestions.push('Check NEO4J_URI in .env file - should be format "bolt://localhost:7687"');
    }

    if (errorReport.message.includes("API_KEY")) {
      suggestions.push("Verify API key is correctly set in .env file");
    }

    return {
      success: false,
      message: "Configuration error detected",
      suggestions,
      recoveryType: "CONFIGURATION",
      escalationNeeded: false,
    };
  }

  /**
   * Handle design/architecture errors
   */
  _handleDesignError(errorReport) {
    return {
      success: false,
      message: "Architecture/design issue detected",
      suggestions: [
        "Review system architecture document (docs/architecture.md)",
        "Consider alternative implementation approach",
        "Consult with design architect agent",
      ],
      recoveryType: "DESIGN",
      escalationNeeded: true,
    };
  }

  /**
   * Handle critical errors requiring human intervention
   */
  _handleCriticalError(errorReport) {
    return {
      success: false,
      message: "Critical error requiring human intervention",
      suggestions: [
        "Review error details and context",
        "Consider temporary workaround",
        "Update system to address root cause",
      ],
      recoveryType: "CRITICAL",
      escalationNeeded: true,
    };
  }

  /**
   * Record error patterns for future learning
   */
  _recordPattern(classification, errorReport) {
    const key = `${classification}:${errorReport.agentId}:${errorReport.operation}`;
    let count = this.errorPatterns.get(key) || 0;
    this.errorPatterns.set(key, count + 1);

    // Store in persistent storage for cross-project learning
    if (count % 5 === 0) {
      // Only log every 5 occurrences
      this._persistPattern(key, count + 1, errorReport);
    }
  }

  /**
   * Persist error patterns for long-term learning
   */
  _persistPattern(key, count, errorReport) {
    // Implementation would store in Neo4j or fallback storage
    console.log(`[ErrorHandler] Pattern logged: ${key} (count: ${count})`);
  }
}

// Export singleton instance
module.exports = new ErrorHandler();
