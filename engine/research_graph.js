import * as LangGraph from "@langchain/langgraph";
import { z } from "zod";
import { generateObject } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { getModel } from "../ai/providers.js";
import "dotenv/config.js";

// Define the state for the research graph
const researchState = {
  topic: { value: (x, y) => y, default: () => "" },
  learnings: { value: (x, y) => x.concat(y), default: () => [] },
  search_queries: { value: (x, y) => x.concat(y), default: () => [] },
  final_report: { value: null },
  recursion_level: { value: (x, y) => x + 1, default: () => 0 },
};

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

// Define the nodes for the research graph
async function generateSearchQuery(state) {
  const { topic, learnings } = state;
  const client = getModel();

  const prompt = `You are a research analyst. Based on the primary research goal and the existing learnings, generate a single, highly effective search query to find the next piece of critical information.
---
PRIMARY GOAL: ${topic}
---
EXISTING LEARNINGS:
${learnings.join("\n") || "No learnings yet."}
---
What is the next single most important question to answer?`;

  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({
      query: z.string().describe("The single best search query to run next."),
    }),
  });

  console.log(`[Research Graph] Generated query: "${object.query}"`);
  return { search_queries: [object.query] };
}

async function executeSearch(state) {
  const { search_queries } = state;
  const client = getFirecrawlClient();
  const query = search_queries[search_queries.length - 1]; // Use the latest query

  console.log(`[Research Graph] Executing search for: "${query}"`);
  const searchResults = await client.search(query, {
    pageOptions: { fetchPageContent: true },
  });

  const allContent = searchResults.data
    .map((item) => `Source: ${item.url}\n\n${item.markdown}`)
    .join("\n\n---\n\n");

  return { search_content: allContent };
}

async function synthesizeResults(state) {
  const { topic, search_content } = state;
  const client = getModel();

  const prompt = `Synthesize the key learnings from the following research content related to "${topic}". Extract the most critical insights.
---
CONTENT:
${search_content}`;

  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({
      newLearnings: z.array(z.string()).describe("A list of key insights and facts discovered."),
    }),
  });

  console.log(`[Research Graph] Synthesized ${object.newLearnings.length} new learnings.`);
  return { learnings: object.newLearnings };
}

function checkIfDone(state) {
  const { recursion_level } = state;
  // For now, we'll just do one loop of research. This can be made more sophisticated.
  if (recursion_level > 1) {
    return "generate_report";
  }
  return "continue";
}

async function generateReport(state) {
  const { topic, learnings } = state;
  const final_report = `Research Report for: ${topic}\n\n${learnings.join("\n")}`;
  console.log("[Research Graph] Final report generated.");
  return { final_report };
}

// Build the graph
const builder = new LangGraph.StatefulGraph({
  channels: researchState,
});

builder.addNode("generate_search_query", generateSearchQuery);
builder.addNode("execute_search", executeSearch);
builder.addNode("synthesize_results", synthesizeResults);
builder.addNode("generate_report", generateReport);

builder.setEntryPoint("generate_search_query");

builder.addEdge("generate_search_query", "execute_search");
builder.addEdge("execute_search", "synthesize_results");

builder.addConditionalEdges("synthesize_results", checkIfDone, {
  continue: "generate_search_query",
  generate_report: "generate_report",
});
builder.addEdge("generate_report", LangGraph.END);

const researchGraph = builder.compile();

export { researchGraph };
