import { CodeIntelligenceService } from "../services/code_intelligence_service.js";
import { cachedQuery } from "../utils/queryCache.js";
import { generateObject as defaultGenerateObject } from "ai";
import { z } from "zod";

// Instantiate the single service that all tools will use.
const codeIntelligenceService = new CodeIntelligenceService();

// ===================================================================
// == AGENT-CALLABLE TOOLS                                          ==
// ===================================================================
// These are the functions that agents are allowed to call.
// They act as a safe and simple API layer over the more complex service.

/**
 * Finds all usages of a given symbol in the codebase.
 * This is the missing tool function.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.symbolName - The name of the class, function, or variable to find.
 * @returns {Promise<Array>} A list of usage locations.
 */
export async function findUsages({ symbolName }) {
  return codeIntelligenceService.findUsages({ symbolName });
}

/**
 * Gets the source code definition of a given symbol.
 * This is the missing tool function.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.symbolName - The name of the class, function, or variable.
 * @returns {Promise<object>} An object containing the definition and file path.
 */
export const getDefinition = cachedQuery("getDefinition", ({ symbolName }) =>
  codeIntelligenceService.getDefinition({ symbolName })
);

/**
 * Gets the list of modules that a given file depends on.
 * This is the missing tool function.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.filePath - The path to the file to analyze.
 * @returns {Promise<Array>} A list of imported modules.
 */
export async function getModuleDependencies({ filePath }) {
  return codeIntelligenceService.getModuleDependencies({ filePath });
}

/**
 * Provides a high-level overview of the entire indexed codebase.
 * @returns {Promise<string>} A string summarizing the files, classes, and functions.
 */
export async function getFullCodebaseContext() {
  const queryResults = await codeIntelligenceService._runQuery(
    `MATCH (f:File)-[:CONTAINS]->(m:Member) RETURN f.path as file, collect({name: m.name, type: m.type}) as members`
  );

  if (!queryResults || queryResults.length === 0) {
    return "No code intelligence data found. The database may be empty or the initial indexing failed.";
  }

  let summary = "Current Codebase Structure:\n\n";
  queryResults.forEach(record => {
    // This logic handles both real Neo4j records and mocked test objects
    const file = record.get ? record.get('file') : record.file;
    const members = record.get ? record.get('members').map(m => m.properties) : record.members;

    summary += `- File: ${file}\n`;
    if (members && members.length > 0) {
      members.forEach(member => {
        summary += `  - ${member.type}: ${member.name}\n`;
      });
    } else {
      summary += "  (No defined classes or functions found)\n";
    }
  });

  return summary;
}

/**
 * Validates a proposed technology against project goals using an LLM.
 * @param {object} args
 * @param {string} args.technology - The technology to validate.
 * @param {string} args.project_goal - The high-level project goal.
 * @param {object} ai - The AI provider object.
 * @param {object} config - The configuration object.
 * @returns {Promise<object>} The validation result.
 */
export async function validate_tech_stack({ technology, project_goal }, ai, config) {
  const { getModelForTier } = ai;
  const { client, modelName } = getModelForTier('b_tier', null, config);
  const { object } = await defaultGenerateObject({
    model: client(modelName),
    prompt: `As a senior solutions architect, analyze the suitability of using "${technology}" for a project with the goal: "${project_goal}".`,
    schema: z.object({
      is_suitable: z.boolean(),
      pros: z.array(z.string()),
      cons: z.array(z.string()),
      recommendation: z.string(),
    }),
  });
  return object;
}

/**
 * Initializes the CodeRAG service for the specified project, indexing all code.
 * This is a system-level tool called by the engine during the intelligence phase.
 * @param {object} args - The arguments for the tool.
 * @param {string} args.projectRoot - The absolute path to the project to be indexed.
 * @returns {Promise<object>} A confirmation message.
 */
export async function index_project({ projectRoot }) {
    // Instantiate the service without projectRoot, as it's no longer needed in the constructor.
    const service = new CodeIntelligenceService();
    // Call the new, dedicated method for project-specific indexing.
    await service.runIndexingForProject(projectRoot);
    return { success: true, message: `CodeRAG indexing initiated for ${projectRoot}` };
}