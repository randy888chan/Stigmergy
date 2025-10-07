import { codeIntelligenceService } from '../services/code_intelligence_service.js';
import { githubMCPService } from '../services/github_mcp_service.js';

/**
 * Searches for code patterns both locally and on GitHub, then fuses the results.
 * @param {{ query: string }} args - The search query.
 * @returns {Promise<Array<{ source: string, content: string, path: string }>>} A unified list of code patterns.
 */
export async function search_for_code_patterns({ query }) {
  console.log(`Fusion Search initiated for: "${query}"`);

  try {
    // 1. Simultaneously search local and GitHub sources
    const [localResults, githubResults] = await Promise.all([
      codeIntelligenceService.semanticSearch({ query }),
      githubMCPService.search({ query }),
    ]);

    // 2. Label and format the results
    const formattedLocal = localResults.map(item => ({
      ...item,
      source: 'Local',
    }));

    const formattedGithub = githubResults.map(item => ({
      ...item,
      source: 'From GitHub',
    }));

    // 3. Combine and de-duplicate the results
    const combinedResults = [...formattedLocal, ...formattedGithub];
    const uniqueResults = [];
    const seenContent = new Set();

    for (const result of combinedResults) {
      // Simple deduplication based on the content of the code snippet
      if (result.content && !seenContent.has(result.content)) {
        seenContent.add(result.content);
        uniqueResults.push(result);
      }
    }

    console.log(`Fusion Search found ${uniqueResults.length} unique results.`);
    return uniqueResults;
  } catch (error) {
    console.error('Error during intelligence fusion search:', error);
    // Return an empty array or rethrow, depending on desired error handling.
    // For agent stability, returning an empty array is often safer.
    return [];
  }
}