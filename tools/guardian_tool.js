/**
 * Creates the toolset for the guardian agent, which requires access to the main engine.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The guardian toolset.
 */
export default (engine) => ({
  /**
   * Proposes a change to a core system file to the @guardian agent.
   * @param {Object} args
   * @param {string} args.file_path - The path to the file to be changed, relative to the .stigmergy-core directory.
   * @param {string} args.new_content - The new content for the file.
   * @param {string} args.reason - The reason for the proposed change.
   * @returns {Promise<string>} The result of the guardian's action.
   */
  propose_change: async ({ file_path, new_content, reason }) => {
    if (!file_path || typeof new_content === 'undefined' || !reason) {
      throw new Error("The 'file_path', 'new_content', and 'reason' arguments are required for guardian.propose_change.");
    }

    console.log(`[Metis] Proposing change for ${file_path} to @guardian.`);

    const prompt = `
A system improvement has been proposed by @metis.
Reason: ${reason}

As the @guardian, you MUST follow your core protocols.
First, run core.validate to ensure system integrity.
If validation passes, you may apply the patch using core.applyPatch.

PROPOSED CHANGE DETAILS:
---
FILE_PATH: ${file_path}
---
NEW_CONTENT:
\`\`\`
${new_content}
\`\`\`
---
Please proceed with validation and application.
`;

    // Call the @guardian agent to perform the change.
    const result = await engine.triggerAgent("guardian", prompt);
    return `Proposal sent to @guardian. Response: ${result}`;
  },
});
