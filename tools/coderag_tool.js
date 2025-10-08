import { unifiedIntelligenceService } from '../services/unified_intelligence.js';

/**
 * A unified tool for interacting with the CodeRAG intelligence service.
 * This tool provides a single, powerful interface for agents to perform
 * advanced code analysis, search, and metric calculation.
 * The project_root context is passed in by the tool executor.
 */

/**
 * Performs a comprehensive scan of the entire codebase to build or update the intelligence index.
 * @param {object} args An object containing the project_root.
 * @param {string} args.project_root The absolute path to the project's root directory.
 * @returns {Promise<object>} A summary report of the scan, including files indexed.
 */
export async function scan_codebase({ project_root }) {
  try {
    if (!project_root) return "Error: project_root was not provided by the executor.";

    const report = await unifiedIntelligenceService.scanCodebase({ project_root });
    return `Codebase scan complete. Report: ${JSON.stringify(report)}`;
  } catch (error) {
    console.error("Error during codebase scan:", error);
    return `Error scanning codebase: ${error.message}`;
  }
}

/**
 * Calculates a suite of software metrics (e.g., CK, Halstead) for the project.
 * @returns {Promise<object>} An object containing the calculated metrics.
 */
export async function calculate_metrics({}) {
  try {
    const metrics = await unifiedIntelligenceService.calculateMetrics();
    return `Metrics calculation complete: ${JSON.stringify(metrics)}`;
  } catch (error) {
    console.error("Error calculating metrics:", error);
    return `Error calculating metrics: ${error.message}`;
  }
}

/**
 * Performs a semantic search for a given query across the entire codebase.
 * @param {object} args An object containing the query and project_root.
 * @param {string} args.query The natural language query describing the code to find.
 * @param {string} args.project_root The absolute path to the project's root directory.
 * @returns {Promise<Array<object>>} A list of search results with code snippets and file paths.
 */
export async function semantic_search({ query, project_root }) {
  if (!query) {
    return "Error: The 'query' argument is required for semantic_search.";
  }
  try {
    if (!project_root) return "Error: project_root was not provided by the executor.";

    const results = await unifiedIntelligenceService.semanticSearch({ query, project_root });
    return results;
  } catch (error) {
    console.error(`Error during semantic search for query "${query}":`, error);
    return `Error performing semantic search: ${error.message}`;
  }
}

/**
 * Analyzes the codebase to identify potential architectural issues like cyclic dependencies or unstable components.
 * @returns {Promise<Array<object>>} A list of identified architectural concerns with explanations.
 */
export async function find_architectural_issues({}) {
  try {
    const issues = await unifiedIntelligenceService.findArchitecturalIssues();
    if (issues.length === 0) {
      return "No significant architectural issues found.";
    }
    return issues;
  } catch (error) {
    console.error("Error finding architectural issues:", error);
    return `Error analyzing architecture: ${error.message}`;
  }
}