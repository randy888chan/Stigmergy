import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import { MemorySaver } from "@langchain/langgraph";

// Mock the database
jest.mock("../../src/infrastructure/state/GraphStateManager.js", () => ({
    __esModule: true,
    default: {
        initializeSchema: jest.fn().mockResolvedValue(true),
    },
}));

// Mock the sub-graphs
const mockPlanningGraphInvoke = jest.fn().mockResolvedValue({
    architecture_plan: "Final plan from mock",
});
jest.mock("../../engine/planning_graph.js", () => ({
    createPlanningGraph: jest.fn().mockReturnValue({
        invoke: mockPlanningGraphInvoke,
    }),
}));

jest.mock("../../engine/execution_graph.js", () => ({
    createExecutionGraph: jest.fn().mockReturnValue({
        batch: jest.fn(), // Not called in this test
    }),
}));

describe("Context Preparer Integration Test", () => {
  let engine;
  let memory;
  const thread_id = "context-preparer-test-thread";

  beforeEach(() => {
    jest.clearAllMocks();
    memory = new MemorySaver();
    engine = new Engine();
    // Mock the triggerAgent method to control the context preparer's output
    engine.triggerAgent = jest.fn().mockImplementation(async (agentId, prompt) => {
        if (agentId === 'context_preparer') {
            return "This is the rich context package.";
        }
        return `Result from ${agentId}`;
    });
    engine.initialize(memory);
  });

  test("should call context_preparer_node first and pass its output to the planning team", async () => {
    const config = { configurable: { thread_id: thread_id } };
    const goal = "Test goal for context preparer";

    // Invoke the graph. It should run context preparer, then planning, then interrupt.
    const result = await engine.graph.invoke({ goal }, config);

    // 1. Verify context_preparer was called with the goal.
    expect(engine.triggerAgent).toHaveBeenCalledWith(
        "context_preparer",
        `Prepare a detailed context package for the following goal: ${goal}`
    );

    // 2. Verify the output of the context preparer was passed to the planning graph.
    expect(mockPlanningGraphInvoke).toHaveBeenCalledWith({
        goal: goal,
        context: "This is the rich context package.",
    });
    
    // 3. Verify the graph is now interrupted, waiting for human approval.
    expect(result).toHaveProperty("__interrupt__");
  });
});
