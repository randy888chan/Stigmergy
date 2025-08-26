import { CodeIntelligenceService } from "../services/code_intelligence_service.js";
const codeIntelligenceService = new CodeIntelligenceService();
import { cachedQuery } from "../utils/queryCache.js";
import { getModelForTier } from "../ai/providers.js";
import { generateObject } from "ai";
import { z } from "zod";

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

/**
 * NEW TOOL: Validates a proposed technology against project goals.
 * @param {object} args
 * @param {string} args.technology - The technology to validate (e.g., "React", "PostgreSQL").
 * @param {string} args.project_goal - The high-level project goal.
 * @returns {Promise<{is_suitable: boolean, pros: string[], cons: string[], recommendation: string}>}
 */
export async function validate_tech_stack({ technology, project_goal }) {
  console.log(`[Code Intelligence] Validating tech: ${technology} for goal: ${project_goal}`);
  const { object } = await generateObject({
    model: getModelForTier('b_tier'),
    prompt: `As a senior solutions architect, analyze the suitability of using "${technology}" for a project with the goal: "${project_goal}".
        Provide a concise analysis focusing on pros and cons. Conclude with a clear recommendation.`,
    schema: z.object({
      is_suitable: z
        .boolean()
        .describe("Is this technology a suitable choice for the project goal?"),
      pros: z.array(z.string()).describe("List 2-3 key advantages."),
      cons: z.array(z.string()).describe("List 2-3 key disadvantages or risks."),
      recommendation: z
        .string()
        .describe("A final recommendation on whether to use this technology."),
    }),
  });
  return object;
}
