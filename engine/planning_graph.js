import { researchGraph } from "./research_graph.js";

export function createPlanningGraph(triggerAgent) {
  return {
    async invoke({ goal }) {
      console.log(`[Planning Graph] Processing goal: ${goal}`);
      
      // Call the research graph first
      const researchResult = await researchGraph.invoke({ 
        topic: goal,
        learnings: []
      });
      
      // Then proceed with the planning sequence
      const architectureResult = await triggerAgent('design-architect', `Research: ${researchResult.final_report}`);
      const uxResult = await triggerAgent('ux-expert', `Architecture: ${architectureResult}`);
      
      return {
        research_report: researchResult.final_report,
        architecture_plan: architectureResult,
        ui_mockups: uxResult,
        goal: goal
      };
    }
  };
}

export default createPlanningGraph;