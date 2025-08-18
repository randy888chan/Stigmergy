/**
 * Creates the toolset for the guardian agent, which requires access to the main engine.
 * @param {import('../engine/server.js').Engine} engine - The main engine instance.
 * @returns {Object} The guardian toolset.
 */
export default (engine) => ({
  /**
   * Proposes a change to a core system file to the @guardian agent.
   * This tool is intended for use by the @metis agent.
   * @param {Object} args
   * @param {string} args.file_path - The path to the file to be changed, relative to the .stigmergy-core directory.
   * @param {string} args.new_content - The new, complete content for the file.
   * @param {string} args.reason - The reason for the proposed change.
   * @returns {Promise<string>} The result of the guardian's action.
   */
  propose_change: async ({ file_path, new_content, reason }) => {
    if (!file_path || typeof new_content === "undefined" || !reason) {
      throw new Error(
        "The 'file_path', 'new_content', and 'reason' arguments are required for guardian.propose_change."
      );
    }

    console.log(`[Metis -> Guardian] Proposing change for ${file_path}. Reason: ${reason}`);

    // This prompt is a highly structured command for the @guardian agent.
    const guardianPrompt = `
      An automated system improvement has been proposed by @metis.
      As the @guardian, you MUST follow your core protocols to ensure system safety.

      **Reason for Change:**
      ${reason}

      **Validation Steps:**
      1.  **Backup:** First, you MUST use the \`core.backup\` tool to create a new restore point.
      2.  **Validate:** Second, you MUST use the \`core.validate\` tool to ensure the proposed change does not compromise system integrity.
      3.  **Apply:** ONLY if validation is successful, use the \`core.applyPatch\` tool to write the new content to the specified file.

      **PROPOSED CHANGE DETAILS:**
      ---
      **FILE_PATH:** ${file_path}
      ---
      **NEW_CONTENT:**
      \`\`\`
      ${new_content}
      \`\`\`
      ---
      Please proceed with the validation and application workflow now.
    `;

    // Trigger the @guardian agent to perform the protected operation.
    // In a real running engine, this would dispatch the task.
    // For now, we simulate this call. In a live system, you'd use the engine's dispatcher.
    if (engine && typeof engine.triggerAgent === "function") {
      const result = await engine.triggerAgent("guardian", guardianPrompt);
      return `Proposal sent to @guardian. Response: ${result}`;
    } else {
      // Fallback for environments where the engine isn't available (e.g., simple tool testing)
      console.warn("[Guardian Tool] Engine not available. Simulating guardian approval.");
      return `Proposal for ${file_path} would be sent to @guardian for approval.`;
    }
  },
});
