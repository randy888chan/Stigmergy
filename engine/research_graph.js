import { END, StateGraph } from "@langchain/langgraph";
import { research } from "../tools/research.js";
import { getModel } from "../ai/providers.js";

const graphState = {
  topic: { value: null },
  initial_learning: { value: null },
  new_questions: { value: null },
  final_report: { value: null },
  is_done: { value: null },
};

const researchNode = async (state) => {
  const researchResult = await research.search(state.topic);
  return { initial_learning: researchResult };
};

const reflectionNode = async (state) => {
  const model = getModel("reflection_tier");
  const prompt = `You are a researcher. You have been given a topic and some initial research. Your job is to reflect on the research and determine if it is complete. If it is complete, respond with "true". Otherwise, respond with a list of new questions to research.

Topic: ${state.topic}
Initial Learning: ${state.initial_learning}
`;
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
