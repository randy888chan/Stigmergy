// Mock planning graph for testing purposes
// This is a placeholder file to resolve test imports

export function createPlanningGraph(triggerAgent) {
  return {
    async invoke({ goal }) {
      console.log(`[Mock Planning Graph] Processing goal: ${goal}`);
      
      // Mock the planning sequence
      const researchResult = { final_report: `Mock research for: ${goal}` };
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