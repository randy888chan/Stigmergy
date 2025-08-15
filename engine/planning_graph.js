import { StateGraph, END } from "@langchain/langgraph";
import { researchGraph } from "./research_graph.js";

// Define the state for the planning graph
export const planningState = {
  goal: null, // The high-level user goal
  research_report: null, // Output from the research team
  architecture_plan: null, // Output from the architect
  ui_mockups: null, // Output from the UX expert
};

export function createPlanningGraph(triggerAgent) {
  const planningGraphBuilder = new StateGraph({ channels: planningState });

  // 1. Nodes
  const researchNode = async (state) => {
    console.log("[Planning Team] Starting research...");
    // The research graph is self-contained and doesn't need the triggerAgent function
    const researchResult = await researchGraph.invoke({ topic: state.goal, learnings: [] });
    return { research_report: researchResult.final_report };
  };

  const architectNode = async (state) => {
    console.log("[Planning Team] Architecting the solution...");
    const prompt = `Based on the following research report, create a detailed architecture plan.\n\nRESEARCH REPORT:\n${state.research_report}`;
    const plan = await triggerAgent("design-architect", prompt);
    return { architecture_plan: plan };
  };

  const uxDesignerNode = async (state) => {
    console.log("[Planning Team] Designing the UI/UX...");
    const prompt = `Based on the architecture plan, use the SuperDesign tool to generate UI mockups.\n\nARCHITECTURE PLAN:\n${state.architecture_plan}`;
    const mockups = await triggerAgent("ux-expert", prompt);
    return { ui_mockups: mockups };
  };

  planningGraphBuilder.addNode("research_team", researchNode);
  planningGraphBuilder.addNode("architect_agent", architectNode);
  planningGraphBuilder.addNode("ux_designer_agent", uxDesignerNode);

  // 2. Edges
  planningGraphBuilder.setEntryPoint("research_team");
  planningGraphBuilder.addEdge("research_team", "architect_agent");
  planningGraphBuilder.addEdge("architect_agent", "ux_designer_agent");
  planningGraphBuilder.addEdge("ux_designer_agent", END);

  // Export the compiled graph
  return planningGraphBuilder.compile();
}
