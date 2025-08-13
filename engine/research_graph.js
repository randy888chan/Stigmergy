// engine/research_graph.js
import { StateGraph, END } from "@langchain/langgraph";
import { add } from "@langchain/langgraph/prebuilt";
import { z } from "zod";
import { generateObject } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { getModel } from "../ai/providers.js";
import "dotenv/config.js";
import chalk from "chalk";

const researchState = {
  topic: null,
  final_report: null,
  search_content: null,
  learnings: add,
  search_queries: add,
  recursion_level: (a, b) => (a ?? 0) + (b ?? 0),
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

async function generateSearchQuery(state) {
  const { topic, learnings } = state;
  const client = getModel();
  const prompt = `You are a research analyst. Based on the primary research goal and existing learnings, generate a single, effective search query.\nGoal: ${topic}\nLearnings:\n${learnings.join("\n") || "None yet."}\nNext query:`;

  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({ query: z.string().describe("The single best search query to run next.") }),
  });
  console.log(chalk.cyan(`[Research Graph] Generated query: "${object.query}"`));
  return { search_queries: [object.query], recursion_level: 1 };
}

async function executeSearch(state) {
  const { search_queries } = state;
  const client = getFirecrawlClient();
  const query = search_queries[search_queries.length - 1];
  const searchResults = await client.search(query, { pageOptions: { fetchPageContent: true } });
  const allContent = searchResults.data
    .map((item) => `Source: ${item.url}\n\n${item.markdown}`)
    .join("\n\n---\n\n");
  return { search_content: allContent };
}

async function synthesizeResults(state) {
  const { topic, search_content } = state;
  const client = getModel();
  const prompt = `Synthesize key learnings from the following content regarding "${topic}".\nContent:\n${search_content}`;
  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({ newLearnings: z.array(z.string()).describe("Key insights and facts.") }),
  });
  return { learnings: object.newLearnings };
}

function checkIfDone(state) {
  return state.recursion_level >= 2 ? "generate_report" : "continue";
}

async function generateReport(state) {
  const { topic, learnings } = state;
  return { final_report: `Research Report for: ${topic}\n\n${learnings.join("\n")}` };
}

const researchGraphBuilder = new StateGraph({ channels: researchState });
researchGraphBuilder.addNode("generate_search_query", generateSearchQuery);
researchGraphBuilder.addNode("execute_search", executeSearch);
researchGraphBuilder.addNode("synthesize_results", synthesizeResults);
researchGraphBuilder.addNode("generate_report", generateReport);
researchGraphBuilder.setEntryPoint("generate_search_query");
researchGraphBuilder.addEdge("generate_search_query", "execute_search");
researchGraphBuilder.addEdge("execute_search", "synthesize_results");
researchGraphBuilder.addConditionalEdges("synthesize_results", checkIfDone, {
  continue: "generate_search_query",
  generate_report: "generate_report",
});
researchGraphBuilder.addEdge("generate_report", END);
export const researchGraph = researchGraphBuilder.compile();
