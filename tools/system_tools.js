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
    await engine.stateManager.updateStatus({ newStatus, message });
    const confirmation = `System status successfully updated to ${newStatus}.`;
    console.log(`[System Tool] ${confirmation}`);
    return confirmation;
  },
});
