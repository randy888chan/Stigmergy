import FirecrawlApp from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { getModel, systemPrompt } from "../ai/providers.js";
import { z } from "zod";
import "dotenv/config.js";

// *** THE FIX: Lazy initialize the client inside the function ***
let firecrawl;
function getFirecrawlClient() {
  if (!firecrawl) {
    if (!process.env.FIRECRAWL_KEY) {
      throw new Error("FIRECRAWL_KEY environment variable is not set.");
    }
    firecrawl = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_KEY });
  }
  return firecrawl;
}

export async function deep_dive({ query, breadth = 3, depth = 2 }) {
  const client = getFirecrawlClient(); // Initialize client on first use
  // ... (rest of the function is the same)
  let learnings = [];
  let visitedUrls = new Set();
  for (let d = 0; d < depth; d++) {
    const serpGen = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Generate ${breadth} search queries for: ${query}. History: ${learnings.join("\n")}`,
      schema: z.object({ queries: z.array(z.string()) }),
    });
    const searchQueries = serpGen.object.queries;
    const crawlResults = await Promise.all(
      searchQueries.map(async (sq) => {
        try {
          const searchResults = await client.search(sq, {
            pageOptions: { fetchPageContent: true },
          });
          searchResults.data.forEach((item) => visitedUrls.add(item.url));
          return searchResults.data
            .map((item) => `Source: ${item.url}\n\n${item.markdown}`)
            .join("\n\n---\n\n");
        } catch (error) {
          return "";
        }
      })
    );
    const allContent = crawlResults.filter(Boolean).join("\n\n---\n\n");
    const synthesis = await generateObject({
      model: getModel(),
      system: systemPrompt(),
      prompt: `Synthesize learnings from:\n${allContent}`,
      schema: z.object({ newLearnings: z.array(z.string()), nextResearchFocus: z.string() }),
    });
    learnings.push(...synthesis.object.newLearnings);
    query = synthesis.object.nextResearchFocus;
  }
  return (
    `## Research Report for: "${query}"\n\n### Findings:\n\n` +
    learnings.map((l) => `- ${l}`).join("\n") +
    `\n\n### Sources:\n\n` +
    Array.from(visitedUrls)
      .map((url) => `- ${url}`)
      .join("\n")
  );
}
