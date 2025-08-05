// tools/diagnostic_tools.js (NEW)

/**
 * In a real implementation, these functions would be imported from other modules.
 * For example, `restartNeo4j` might come from a service management module,
 * and `useSQLiteFallback` from the fallback manager.
 * Since they are referenced as strings in `automatedFix`, we don't need
 * to define them here, but we acknowledge their conceptual existence.
 */

export function diagnoseStartupIssues() {
  return {
    steps: [
      "1. Check Neo4j is running: 'sudo service neo4j status'",
      "2. Validate .env credentials by checking for the presence of required keys.",
      "3. Run 'npm run test:neo4j' to verify the connection.",
      "4. Check port availability for the engine (e.g., 3000) and Neo4j (e.g., 7687) using 'lsof -i :<port>'",
    ],
    automatedFix:
      "try { await restartNeo4j() } catch (e) { useSQLiteFallback() }",
  };
}
