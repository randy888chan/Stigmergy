/**
 * @module notification_tool
 * @description A tool for sending milestone notifications.
 */

/**
 * Sends a milestone notification to the console.
 * In a real-world scenario, this could be extended to send emails, Slack messages, or IDE notifications.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.message - The milestone message to be sent.
 * @returns {Promise<string>} A confirmation message.
 */
export async function send_milestone({ message }) {
  if (!message) {
    throw new Error("A 'message' is required to send a milestone notification.");
  }

  const timestamp = new Date().toISOString();
  const formattedMessage = `[MILESTONE] ${timestamp}: ${message}`;

  console.log(`\n✅ --- MILESTONE REACHED ---\n${formattedMessage}\n---------------------------\n`);

  // Here you could add integrations for Slack, email, etc.

  return `Milestone notification sent successfully: "${message}"`;
}
