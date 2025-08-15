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

    // Stage 1: Invoke the graph. It runs the planning team and interrupts for approval.
    const planningResult = await engine.graph.invoke({ goal: "Test goal" }, config);

    // Verify the interruption happened as expected.
    expect(planningResult).toHaveProperty("__interrupt__");
    expect(engine.planningGraph.invoke).toHaveBeenCalledTimes(1);
    expect(engine.executionGraph.batch).not.toHaveBeenCalled();

    // --- THIS IS THE DEFINITIVE FIX ---
    // Stage 2: Manually update the state in the checkpointer and resume with null.
    const currentState = await memory.get(config);
    currentState.values.user_feedback = "proceed"; // Manually add the approval signal.
    await memory.put(config, currentState); // Save the updated state.
    
    // Resume by calling invoke with `null`. This proceeds from the saved state.
    const finalResult = await engine.graph.invoke(null, config);
    // ------------------------------------

    // Stage 3: Verify the graph resumed and completed successfully.
    expect(finalResult).not.toHaveProperty("__interrupt__");
    expect(engine.executionGraph.batch).toHaveBeenCalledTimes(1);
    expect(finalResult.last_result).toEqual([{ code: "final code from mock" }]);
  });
});
