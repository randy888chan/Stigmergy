const FirecrawlApp = require('@mendable/firecrawl-js').default;
const { generateObject } = require('ai');
const { getModel, systemPrompt } = require('../ai/providers'); // Assuming you create this helper
const z = require('zod');

// Initialize Firecrawl with API key from environment
const firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_KEY });

/**
 * Performs iterative, deep research on a topic using Firecrawl and an LLM.
 * Based on the architecture from dzhng-deep-research.
 * @param {object} args - The arguments for the deep dive.
 * @param {string} args.query - The initial research query.
 * @param {number} [args.breadth=3] - The number of search queries per level.
 * @param {number} [args.depth=2] - The number of research levels to go down.
 * @returns {Promise<string>} A comprehensive markdown report of the findings.
 */
async function deep_dive({ query, breadth = 3, depth = 2 }) {
  console.log(`[Research Tool] Starting deep dive for query: "${query}" (Depth: ${depth}, Breadth: ${breadth})`);

  let learnings = [];
  let visitedUrls = new Set();
  let currentQuery = query;

  for (let d = 0; d < depth; d++) {
    console.log(`[Research Tool] Depth ${d + 1}/${depth}. Current query focus: "${currentQuery}"`);
    
    // 1. Generate search queries using an LLM
    const serpGen = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Generate ${breadth} unique search queries to research: ${currentQuery}. Previous learnings: ${learnings.join('\n')}`,
      schema: z.object({
        queries: z.array(z.string()).describe(`An array of ${breadth} search queries.`),
      }),
    });
    const searchQueries = serpGen.object.queries;

    // 2. Execute searches and scrape content with Firecrawl
    const crawlResults = await Promise.all(
      searchQueries.map(async (searchQuery) => {
        try {
          const searchResults = await firecrawl.search(searchQuery, {
            pageOptions: {
              fetchPageContent: true // Fetch the full markdown content
            }
          });
          
          // Add URLs to visited set
          searchResults.data.forEach(item => visitedUrls.add(item.url));
          
          // Return the clean markdown content
          return searchResults.data.map(item => `Source: ${item.url}\n\n${item.markdown}`).join('\n\n---\n\n');
        } catch (error) {
          console.error(`[Research Tool] Error during Firecrawl search for "${searchQuery}":`, error);
          return "";
        }
      })
    );
    
    const allContent = crawlResults.filter(Boolean).join('\n\n---\n\n');

    // 3. Synthesize learnings and generate next query focus
    const synthesis = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Synthesize the following research content to extract key learnings and determine the most valuable direction for deeper research. Original goal: ${query}. Current focus: ${currentQuery}.\n\nContent:\n${allContent}`,
      schema: z.object({
        newLearnings: z.array(z.string()).describe("A list of key insights and facts from the content."),
        nextResearchFocus: z.string().describe("A refined query for the next level of research."),
      }),
    });

    learnings.push(...synthesis.object.newLearnings);
    currentQuery = synthesis.object.nextResearchFocus;
  }
  
  // 4. Final Report Generation
  const finalReport = `## Research Report for: "${query}"\n\n### Key Findings:\n\n` + 
                      learnings.map(l => `- ${l}`).join('\n') +
                      `\n\n### Sources Visited:\n\n` +
                      Array.from(visitedUrls).map(url => `- ${url}`).join('\n');
                      
  return finalReport;
}

module.exports = {
  deep_dive,
};
