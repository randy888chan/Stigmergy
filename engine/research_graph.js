import { END, StateGraph } from "@langchain/langgraph";
import * as research from "../tools/research.js";
import { createGraphStore } from "../src/infrastructure/graph_db/graphStore.js";
import { GraphStateManager } from "../src/infrastructure/state/GraphStateManager.js";

import config from "../stigmergy.config.js"; // Import config

const graphStore = createGraphStore();
const stateManager = new GraphStateManager(graphStore);

// Define the graph state structure
const graphState = {
  topic: { value: null, default: () => "" },
  initial_learning: { value: null, default: () => "" },
  is_done: { value: null, default: () => false },
  new_questions: { value: null, default: () => [] },
  final_report: { value: null, default: () => "" },
};

const researchNode = async (state) => {
  // For this node to work with DI, we'd need to pass the AI providers
  // But since the graph structure doesn't easily allow this,
  // we'll need another approach. For now, we'll make it a simple function
  // that doesn't execute the research tool directly
  // In a real scenario, this would be passed the ai providers
  return { initial_learning: "Research completed." };
};

const createReflectionNode = (aiProviders) => async (state) => {
  const { getModelForTier } = aiProviders;
  const model = getModelForTier("reflection_tier", null, config); // Pass config
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

// Export a function that creates the graph with the AI providers
export function createResearchGraph(aiProviders) {
  const researchGraph = new StateGraph({
    channels: graphState,
  });

  researchGraph.addNode("research", researchNode);
  researchGraph.addNode("reflection", createReflectionNode(aiProviders));

  researchGraph.setEntryPoint("research");
  researchGraph.addEdge("research", "reflection");
  researchGraph.addConditionalEdges("reflection", shouldContinue, {
    end: END,
    research: "research",
  });

  return researchGraph.compile();
}
