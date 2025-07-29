import FirecrawlApp from "@mendable/firecrawl-js";
import { generateObject } from "ai";
import { getModel, systemPrompt } from "../ai/providers.js";
import { z } from "zod";
import "dotenv/config.js";

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

export async function deep_dive({ query, learnings = [] }) {
  const client = getFirecrawlClient();
  const serpGen = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: `You are a research analyst. Based on the primary research goal and the existing learnings, generate a single, highly effective search query to find the next piece of critical information.
    ---
    PRIMARY GOAL: ${query}
    ---
    EXISTING LEARNINGS:
    ${learnings.join("\n") || "No learnings yet."}
    ---
    What is the next single most important question to answer?`,
    schema: z.object({
      query: z.string().describe("The single best search query to run next."),
    }),
  });

  const searchQuery = serpGen.object.query;
  console.log(`[Research] Executing search: "${searchQuery}"`);

  const searchResults = await client.search(searchQuery, {
    pageOptions: { fetchPageContent: true },
  });

  const allContent = searchResults.data
    .map(item => `Source: ${item.url}\n\n${item.markdown}`)
    .join("\n\n---\n\n");

  const synthesis = await generateObject({
    model: getModel(),
    system: systemPrompt(),
    prompt: `Synthesize the key learnings from the following research content. Extract the most critical insights. Additionally, propose 3-5 new, more specific search queries based on what you've just learned.
    ---
    CONTENT:
    ${allContent}`,
    schema: z.object({
      newLearnings: z.array(z.string()).describe("A list of key insights and facts discovered."),
      next_research_queries: z.array(z.string()).describe("A list of new, more focused search queries to continue the research."),
    }),
  });

  const visitedUrls = searchResults.data.map(item => item.url);

  return {
    new_learnings: synthesis.object.newLearnings,
    next_research_queries: synthesis.object.next_research_queries,
    sources: visitedUrls,
  };
}
