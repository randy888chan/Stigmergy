import { StateGraph, END } from "@langchain/langgraph";
import { z } from "zod";
import { generateObject } from "ai";
import FirecrawlApp from "@mendable/firecrawl-js";
import { getModelForTier } from "../ai/providers.js";
import "dotenv/config.js";
import chalk from "chalk";

const researchState = {
  topic: { value: (x, y) => y, default: () => "" },
  final_report: { value: (x, y) => y, default: () => null },
  search_content: { value: (x, y) => y, default: () => null },
  learnings: { value: (x, y) => y, default: () => [] }, // Use a simple replacement reducer
  search_queries: { value: (x, y) => x.concat(y), default: () => [] },
  is_done: { value: (x, y) => y, default: () => false },
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
  const { topic, learnings = [], search_queries = [] } = state;
  const client = getModelForTier('a_tier');

  // If search_queries is empty, it's the first run.
  if (search_queries.length === 0) {
    const prompt = `You are a research analyst. Based on the primary research goal and existing learnings, generate a single, effective search query.\nGoal: ${topic}\nLearnings:\n${learnings.join("\n") || "None yet."}\nNext query:`;
    const { object } = await generateObject({
      model: client,
      prompt,
      schema: z.object({ query: z.string().describe("The single best search query to run next.") }),
    });
    console.log(chalk.cyan(`[Research Graph] Generated initial query: "${object.query}"`));
    return { search_queries: [object.query] };
  }

  // On subsequent runs, the reflection node has provided queries.
  // The executeSearch node will use the latest one.
  console.log(chalk.cyan(`[Research Graph] Proceeding with reflective query.`));
  return {};
}

async function executeSearch(state) {
  const { search_queries } = state;
  const client = getFirecrawlClient();
  const query = search_queries[search_queries.length - 1];
  console.log(chalk.blue(`[Research Graph] Executing search for: "${query}"`));
  const searchResults = await client.search(query, { pageOptions: { fetchPageContent: true } });
  const allContent = searchResults.data
    .map((item) => `Source: ${item.url}\n\n${item.markdown}`)
    .join("\n\n---\n\n");
  return { search_content: allContent };
}

async function synthesizeResults(state) {
  const { topic, search_content, learnings } = state; // Get existing learnings
  const client = getModelForTier('a_tier');
  const prompt = `Synthesize key learnings from the following content regarding "${topic}".\nContent:\n${search_content}`;
  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({ newLearnings: z.array(z.string()).describe("Key insights and facts.") }),
  });
  console.log(chalk.magenta("[Research Graph] Synthesized new learnings."));
  // Manually add to the existing learnings and return the full list
  return { learnings: learnings.concat(object.newLearnings) };
}

async function reflection_node(state) {
  const { topic, learnings } = state;
  const client = getModelForTier('a_tier');
  const prompt = `Given the initial goal ('${topic}') and the learnings so far, is the information sufficient to generate a comprehensive report? If yes, respond with just the word "true". If no, respond with a list of the 3 most critical, unanswered questions.`;

  const { object } = await generateObject({
    model: client,
    prompt,
    schema: z.object({
      response: z
        .union([z.literal("true"), z.array(z.string())])
        .describe("Either 'true' or a list of new questions."),
    }),
  });

  if (object.response === "true") {
    console.log(chalk.green("[Research Graph] Reflection: Sufficient information gathered."));
    return { is_done: true };
  } else {
    console.log(
      chalk.yellow("[Research Graph] Reflection: More research needed. New questions:"),
      object.response
    );
    return { search_queries: object.response, is_done: false };
  }
}

function shouldContinue(state) {
  return state.is_done ? "generate_report" : "continue";
}

async function generateReport(state) {
  const { topic, learnings } = state;
  console.log(chalk.green("[Research Graph] Generating final report."));
  return { final_report: `Research Report for: ${topic}\n\n${learnings.join("\n")}` };
}

const researchGraphBuilder = new StateGraph({ channels: researchState });
researchGraphBuilder.addNode("generate_search_query", generateSearchQuery);
researchGraphBuilder.addNode("execute_search", executeSearch);
researchGraphBuilder.addNode("synthesize_results", synthesizeResults);
researchGraphBuilder.addNode("reflection_node", reflection_node);
researchGraphBuilder.addNode("generate_report", generateReport);

researchGraphBuilder.setEntryPoint("generate_search_query");
researchGraphBuilder.addEdge("generate_search_query", "execute_search");
researchGraphBuilder.addEdge("execute_search", "synthesize_results");
researchGraphBuilder.addEdge("synthesize_results", "reflection_node");

researchGraphBuilder.addConditionalEdges("reflection_node", shouldContinue, {
  continue: "generate_search_query",
  generate_report: "generate_report",
});

researchGraphBuilder.addEdge("generate_report", END);
export const researchGraph = researchGraphBuilder.compile();
