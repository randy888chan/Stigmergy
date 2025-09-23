import { END, StateGraph } from "@langchain/langgraph";
import { researchGraph } from "./research_graph.js";

const graphState = {
  goal: { value: null },
  research_report: { value: null },
  architecture_plan: { value: null },
  ui_mockups: { value: null },
};

let triggerAgent;

const researchNode = async (state) => {
  const researchResult = await researchGraph.invoke({
    topic: state.goal,
    learnings: [],
  });
  return { research_report: researchResult.final_report };
};

const architectNode = async (state) => {
  const architecture_plan = await triggerAgent("architect", state.goal);
  return { architecture_plan };
};

const uxDesignerNode = async (state) => {
  const ui_mockups = await triggerAgent("ux-designer", state.goal);
  return { ui_mockups };
};

export const createPlanningGraph = (agentTrigger) => {
  triggerAgent = agentTrigger;

  const planningGraph = new StateGraph({
    channels: graphState,
  });

  planningGraph.addNode("research", researchNode);
  planningGraph.addNode("architect", architectNode);
  planningGraph.addNode("ux-designer", uxDesignerNode);

  planningGraph.setEntryPoint("research");
  planningGraph.addEdge("research", "architect");
  planningGraph.addEdge("architect", "ux-designer");
  planningGraph.addEdge("ux-designer", END);

  return planningGraph.compile();
};
