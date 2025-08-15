import { createPlanningGraph } from "../../engine/planning_graph.js";
import { researchGraph } from "../../engine/research_graph.js";

// Mock the researchGraph
jest.mock("../../engine/research_graph.js", () => ({
  researchGraph: {
    invoke: jest.fn(),
  },
}));

describe("Planning Team Graph", () => {
  let planningGraph;
  let triggerAgent;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock the triggerAgent function
    triggerAgent = jest.fn();
    // Create a new graph for each test
    planningGraph = createPlanningGraph(triggerAgent);
  });

  test("should call nodes in the correct sequence", async () => {
    // Mock the return values of each step
    researchGraph.invoke.mockResolvedValueOnce({ final_report: "Comprehensive research report." });
    triggerAgent.mockResolvedValueOnce("Detailed architecture plan."); // Architect
    triggerAgent.mockResolvedValueOnce("Beautiful UI mockups."); // UX Designer

    const finalState = await planningGraph.invoke({
      goal: "Build a new blog platform",
    });

    // Verify the sequence
    expect(researchGraph.invoke).toHaveBeenCalledWith({
      topic: "Build a new blog platform",
      learnings: [],
    });
    expect(triggerAgent).toHaveBeenCalledWith(
      "design-architect",
      expect.stringContaining("Comprehensive research report.")
    );
    expect(triggerAgent).toHaveBeenCalledWith(
      "ux-expert",
      expect.stringContaining("Detailed architecture plan.")
    );

    // Verify the final state
    expect(finalState.research_report).toBe("Comprehensive research report.");
    expect(finalState.architecture_plan).toBe("Detailed architecture plan.");
    expect(finalState.ui_mockups).toBe("Beautiful UI mockups.");
  });
});
