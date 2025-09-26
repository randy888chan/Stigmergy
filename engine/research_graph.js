import { END, StateGraph } from "@langchain/langgraph";
import * as research from "../tools/research.js";
import { createGraphStore } from "../src/infrastructure/graph_db/graphStore.js";
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";
import { getAiProviders } from "../ai/providers.js";
import config from "../stigmergy.config.js"; // Import config

const graphStore = createGraphStore();
const stateManager = new GraphStateManager(graphStore);

const researchNode = async (state) => {
  const researchResult = await research.deep_dive({ query: state.topic });
  return { initial_learning: researchResult };
};

const reflectionNode = async (state) => {
  // Use the injected getModelForTier function from state, or fall back to default
  const getModelForTier = state.getModelForTier || getAiProviders().getModelForTier;
  const model = getModelForTier("reflection_tier", config); // Pass config
  const prompt = `You are a researcher. You have been given a topic and some initial research. Your job is to reflect on the research and determine if it is complete. If it is complete, respond with "true". Otherwise, respond with a list of new questions to research.\n\nTopic: ${state.topic}\nInitial Learning: ${state.initial_learning}\n`;
  const response = await model.invoke(prompt);

  if (response.toLowerCase().includes("true")) {
    return { is_done: true, final_report: `Research Report for: ${state.topic}\n${state.initial_learning}` };
  } else {
    return { is_done: false, new_questions: response };
  }
};

const shouldContinue = (state) => {
  if (state.is_done) {
    return "end";
  } else {
    return "research";
  }
};

const researchGraph = new StateGraph({
  channels: graphState,
});

researchGraph.addNode("research", researchNode);
researchGraph.addNode("reflection", reflectionNode);

researchGraph.setEntryPoint("research");
researchGraph.addEdge("research", "reflection");
researchGraph.addConditionalEdges("reflection", shouldContinue, {
  end: END,
  research: "research",
});

const compiledGraph = researchGraph.compile();

export { compiledGraph as researchGraph };
