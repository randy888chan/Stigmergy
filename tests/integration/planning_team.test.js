import { createPlanningGraph } from "../../engine/planning_graph.js";

// Mock the researchGraph within the planning_graph module
jest.mock("../../engine/planning_graph.js", () => {
  const actual = jest.requireActual("../../engine/planning_graph.js");
  return {
    ...actual,
    researchGraph: {
      invoke: jest.fn(),
    }
  };
});

// Also mock the research_graph module directly
jest.mock("../../engine/research_graph.js", () => ({
  researchGraph: {
    invoke: jest.fn(),
  },
}));

describe("Planning Team Graph", () => {
  let planningGraph;
  let triggerAgent;
  let researchGraph;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Get the mocked researchGraph
    researchGraph = require("../../engine/research_graph.js").researchGraph;

    // Mock the triggerAgent function
    triggerAgent = jest.fn().mockImplementation((agent, prompt) => {
      return `Response from ${agent} for prompt: ${prompt}`;
    });
    
    // Create a new graph for each test
    planningGraph = createPlanningGraph(triggerAgent);
  });

  test("should call nodes in the correct sequence", async () => {
    // Mock the return values of each step
    researchGraph.invoke.mockResolvedValueOnce({ 
      final_report: "Comprehensive research report.",
      learnings: []
    });
    
    // Mock triggerAgent responses
    triggerAgent
      .mockResolvedValueOnce("Detailed architecture plan.") // Architect
      .mockResolvedValueOnce("Beautiful UI mockups."); // UX Designer

    const finalState = await planningGraph.invoke({
      goal: "Build a new blog platform",
    });

    // Verify the sequence
    expect(researchGraph.invoke).toHaveBeenCalledWith({
      topic: "Build a new blog platform",
      learnings: [],
    });
    
    // Verify the final state contains the expected data
    expect(finalState.research_report).toContain("Comprehensive research report.");
    expect(finalState.architecture_plan).toContain("Detailed architecture plan.");
    expect(finalState.ui_mockups).toContain("Beautiful UI mockups.");
  });
});