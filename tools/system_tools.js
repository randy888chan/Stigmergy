/**
 * Creates the toolset for system-level control, accessible to trusted agents.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The system toolset.
 */
export default (engine) => ({
  /**
   * Updates the overall project status.
   * @param {Object} args
   * @param {string} args.newStatus - The new status for the project.
   * @param {string} args.message - A descriptive message for the status change.
   * @returns {Promise<string>} Confirmation of the status change.
   */
  updateStatus: async ({ newStatus, message }) => {
    if (!newStatus) {
      throw new Error("The 'newStatus' argument is required for system.updateStatus.");
    }
    // Note: We use the engine's stateManagerModule to call the function
    await engine.stateManagerModule.updateStatus({ newStatus, message });
    const confirmation = `System status successfully updated to ${newStatus}.`;
    console.log(`[System Tool] ${confirmation}`);
    return confirmation;
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
