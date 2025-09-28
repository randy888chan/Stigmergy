/**
 * Creates the toolset for system-level control, accessible to trusted agents.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The system toolset.
 */
export default (engine) => ({
  /**
   * Updates the overall project status.
   */
  updateStatus: async ({ newStatus, message }) => {
    if (!newStatus) {
      throw new Error("The 'newStatus' argument is required for system.updateStatus.");
    }
    await engine.stateManager.updateStatus({ newStatus, message });
    const confirmation = `System status successfully updated to ${newStatus}.`;
    console.log(`[System Tool] ${confirmation}`);
    return confirmation;
  },

  /**
   * Sends a structured request for human approval to the dashboard.
   * This is the new tool for the dispatcher's "Human Handoff" protocol.
   * @param {object} args
   * @param {string} args.message - The question for the user (e.g., "Please approve this business plan.").
   * @param {object} args.data - The data to be reviewed (e.g., the content of the business plan).
   * @returns {Promise<string>} Confirmation message.
   */
  request_human_approval: async ({ message, data }) => {
    if (!message || !data) {
      throw new Error("The 'message' and 'data' arguments are required for system.request_human_approval.");
    }
    console.log(`[System Tool] Requesting human approval: ${message}`);
    engine.broadcastEvent('human_approval_request', { message, data });
    return "Request for human approval has been sent to the dashboard.";
  },

  /**
   * Logs a message from an agent, typically used for fallbacks.
   * @param {Object} args
   * @param {string} args.message - The message to log.
   * @returns {Promise<string>} Confirmation of the log.
   */
  log: async ({ message }) => {
    console.log(`[System Tool Log] ${message}`);
    return "Message logged successfully.";
  },
  
  /**
   * Runs the health check script
   * @returns {Promise<Object>} Health check results
   */
  run_health_check: async () => {
    try {
      // Import exec dynamically to avoid issues
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      const { stdout } = await execPromise('bun run scripts/health-check.js');
      return { success: true, report: stdout };
    } catch (error) {
      return { success: false, error: error.message, report: error.stdout || error.stderr };
    }
  },

  /**
   * Runs the validation script
   * @returns {Promise<Object>} Validation results
   */
  run_validation: async () => {
    try {
      // Import exec dynamically to avoid issues
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execPromise = promisify(exec);
      const { stdout } = await execPromise('bun run cli/index.js validate');
      return { success: true, report: stdout };
    } catch (error) {
      return { success: false, error: error.message, report: error.stdout || error.stderr };
    }
  },
});