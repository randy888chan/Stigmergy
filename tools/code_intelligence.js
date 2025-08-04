import codeIntelligenceService from "../services/code_intelligence_service.js";
import { cachedQuery } from "../utils/queryCache.js";

export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}

export const getDefinition = cachedQuery("getDefinition", ({ symbolName }) =>
  codeIntelligenceService.getDefinition({ symbolName })
);

export async function getModuleDependencies({ filePath }) {
  return codeIntelligenceService.getModuleDependencies({ filePath });
}

export async function calculateCKMetrics({ className }) {
  return codeIntelligenceService.calculateCKMetrics({ className });
}

/**
 * NEW: Provides a high-level overview of the entire indexed codebase.
 * @returns {Promise<string>} A string summarizing the files, classes, and functions in the project.
 */
export async function get_full_codebase_context() {
  const query = `
    MATCH (f:Symbol {type: 'File'})
    OPTIONAL MATCH (f)-[:DEFINES]->(c:Symbol)
    WHERE c.type IN ['Class', 'Function', 'Variable']
    WITH f, collect({name: c.name, type: c.type}) AS members
    RETURN f.path AS file, members
    ORDER BY file
  `;
  try {
    const results = await codeIntelligenceService._runQuery(query);
    if (results.length === 0) {
      return "No code intelligence data found. The database may be empty or the initial indexing failed.";
    }

    let summary = "Current Codebase Structure:\\n\\n";
    results.forEach((record) => {
      const file = record.file;
      const members = record.members;
      summary += `- File: ${file}\\n`;
      if (members.length > 0 && members[0].name) {
        members.forEach((member) => {
          summary += `  - ${member.type}: ${member.name}\\n`;
        });
      } else {
        summary += `  (No defined classes or functions found)\\n`;
      }
    });
    return summary;
  } catch (error) {
    console.error("Failed to get full codebase context:", error);
    return `Error retrieving codebase context: ${error.message}. Ensure the Neo4j database is running and configured correctly.`;
  }
}
