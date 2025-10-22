import path from 'path';
import fsDefault from 'fs-extra';

/**
 * Creates the toolset for the guardian agent, which requires access to the main engine.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @param {Object} fs - The filesystem provider (real or mock).
 * @returns {Object} The guardian toolset.
 */
export default (engine, fs = fsDefault) => ({
  /**
   * Proposes a change to a core system file. Instead of triggering an agent directly,
   * it saves the proposal to a file for human review via the Governance dashboard.
   * @param {Object} args
   * @param {string} args.file_path - The path to the file to be changed, relative to the project root.
   * @param {string} args.new_content - The new, complete content for the file.
   * @param {string} args.reason - The reason for the proposed change.
   * @returns {Promise<string>} A confirmation message that the proposal has been saved.
   */
  propose_change: async ({ file_path, new_content, reason }) => {
    if (!file_path || typeof new_content === "undefined" || !reason) {
      throw new Error(
        "The 'file_path', 'new_content', and 'reason' arguments are required for guardian.propose_change."
      );
    }

    const { v4: uuidv4 } = await import('uuid');
    const proposalId = uuidv4();
    const proposalsDir = path.join(engine.corePath, 'proposals');
    await fs.ensureDir(proposalsDir);

    const proposal = {
        id: proposalId,
        file_path,
        new_content,
        reason,
        status: 'pending',
        timestamp: new Date().toISOString()
    };

    const proposalPath = path.join(proposalsDir, `${proposalId}.json`);
    await fs.writeJson(proposalPath, proposal, { spaces: 2 });

    const message = `Proposal ${proposalId} created and is awaiting human review.`;
    console.log(`[Guardian Tool] ${message}`);
    engine.broadcastEvent('new_proposal', proposal); // Notify dashboard
    return message;
  },
});
