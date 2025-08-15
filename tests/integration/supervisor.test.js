import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import { MemorySaver } from "@langchain/langgraph";

// Mock the database to prevent side-effects and connection errors.
jest.mock("../../src/infrastructure/state/GraphStateManager.js", () => ({
    __esModule: true,
    default: {
        initializeSchema: jest.fn().mockResolvedValue(true),
    },
}));

// Mock the sub-graphs that the supervisor delegates to.
jest.mock("../../engine/planning_graph.js", () => ({
    createPlanningGraph: jest.fn().mockReturnValue({
        invoke: jest.fn().mockResolvedValue({
            architecture_plan: "Final plan from mock",
        }),
    }),
}));

jest.mock("../../engine/execution_graph.js", () => ({
    createExecutionGraph: jest.fn().mockReturnValue({
        batch: jest.fn().mockResolvedValue([{ code: "final code from mock" }]),
    }),
}));

describe("Supervisor Graph Integration Test", () => {
  let engine;
  let memory;
  const thread_id = "supervisor-test-thread";

  beforeEach(() => {
    jest.clearAllMocks();
    memory = new MemorySaver();
    engine = new Engine();
    engine.initialize(memory);
  });

  test("should run planning, interrupt, and correctly resume to execution", async () => {
    const config = { configurable: { thread_id: thread_id } };

    // --- STAGE 1: Invoke the graph to run the planning phase ---
    const planningResult = await engine.graph.invoke({ goal: "Test goal" }, config);

    // Verify the interruption happened as expected.
    expect(planningResult).toHaveProperty("__interrupt__");
    expect(engine.planningGraph.invoke).toHaveBeenCalledTimes(1);
    expect(engine.executionGraph.batch).not.toHaveBeenCalled();

    // --- STAGE 2: Manually update the state and resume the graph ---

    // Get the state snapshot from the moment of interruption.
    const currentState = await memory.get(config);
    
    // Manually add the user's approval to the state.
    currentState.values.user_feedback = "proceed";

    // Save the updated state back to the checkpointer.
    await memory.put(config, currentState);

    // Resume the graph by calling invoke with `null`.
    // This tells LangGraph to continue from the saved state without re-running the last node.
    const finalResult = await engine.graph.invoke(null, config);

    // --- STAGE 3: Verify the graph resumed and completed ---
    expect(finalResult).not.toHaveProperty("__interrupt__");
    expect(engine.executionGraph.batch).toHaveBeenCalledTimes(1);
    expect(finalResult.last_result).toEqual([{ code: "final code from mock" }]);
  });
});
