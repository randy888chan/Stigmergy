/**
 * Creates the toolset for the guardian agent, which requires access to the main engine.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The guardian toolset.
 */
export default (engine) => ({
  /**
   * Proposes a change to a core system file to the @guardian agent.
   * @param {Object} args
   * @param {string} args.filePath - The path to the file to be changed, relative to the .stigmergy-core directory.
   * @param {string} args.newContent - The new content for the file.
   * @returns {Promise<string>} The result of the guardian's action.
   */
  proposeChange: async ({ filePath, newContent }) => {
    if (!filePath || typeof newContent === 'undefined') {
      throw new Error("The 'filePath' and 'newContent' arguments are required for guardian.proposeChange.");
    }

    console.log(`[Metis] Proposing change for ${filePath} to @guardian.`);

    const prompt = `
A system improvement has been proposed by @metis.
As the @guardian, you MUST follow your core protocols.
First, run core.validate to ensure system integrity.
If validation passes, you may apply the patch using core.applyPatch.

PROPOSED CHANGE DETAILS:
---
FILE_PATH: ${filePath}
---
NEW_CONTENT:
\`\`\`
${newContent}
\`\`\`
---
Please proceed with validation and application.
`;

    // Call the @guardian agent to perform the change.
    const result = await engine.triggerAgent("guardian", prompt);
    return `Proposal sent to @guardian. Response: ${result}`;
  },
});
