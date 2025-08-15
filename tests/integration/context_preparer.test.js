import { jest } from "@jest/globals";

// Mock dependencies BEFORE importing the Engine
jest.mock("../../src/infrastructure/state/GraphStateManager.js", () => ({
  __esModule: true,
  default: { initializeSchema: jest.fn().mockResolvedValue(true) },
}));

// Mock the planning graph and get a reference to its mock invoke function
const mockPlanningGraphInvoke = jest.fn();
jest.mock("../../engine/planning_graph.js", () => ({
  createPlanningGraph: jest.fn(() => ({
    invoke: mockPlanningGraphInvoke,
  })),
}));

jest.mock("../../engine/execution_graph.js", () => ({
  createExecutionGraph: jest.fn(() => ({
    batch: jest.fn(),
  })),
}));

// Now that mocks are set up, import the modules
import { Engine } from "../../engine/server.js";
import { MemorySaver } from "@langchain/langgraph";

describe("Context Preparer Integration Test", () => {
  let engine;
  let memory;
  const thread_id = "context-preparer-test-thread";

  beforeEach(() => {
    jest.clearAllMocks();
    // Set the mock's return value for this test
    mockPlanningGraphInvoke.mockResolvedValue({
      architecture_plan: "Final plan from mock",
    });

    memory = new MemorySaver();
    engine = new Engine();
    engine.triggerAgent = jest.fn().mockImplementation(async (agentId) => {
      if (agentId === "context_preparer") {
        return "This is the rich context package.";
      }
      return `Result from ${agentId}`;
    });
    engine.initialize(memory);
  });

  test("should call context_preparer_node first and pass its output to the planning team", async () => {
    const config = { configurable: { thread_id: thread_id } };
    const goal = "Test goal for context preparer";

    await engine.graph.invoke({ goal }, config);

    expect(engine.triggerAgent).toHaveBeenCalledWith(
      "context_preparer",
      `Prepare a detailed context package for the following goal: ${goal}`
    );

    expect(mockPlanningGraphInvoke).toHaveBeenCalledWith({
      goal: goal,
      context: "This is the rich context package.",
    });
  });
});
