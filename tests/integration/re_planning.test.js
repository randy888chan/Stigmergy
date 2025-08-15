import { Engine } from "../../engine/server.js";
import { MemorySaver } from "@langchain/langgraph";
import { jest } from "@jest/globals";

describe("Supervisor Periodic Re-planning", () => {
  let engine;
  let checkpointer;

  beforeEach(() => {
    engine = new Engine();
    checkpointer = new MemorySaver();
    engine.initialize(checkpointer);
  });

  test("should trigger periodic review node after enough tasks are completed", async () => {
    const tasks = [
      { task: "Task 1" },
      { task: "Task 2" },
      { task: "Task 3" },
      { task: "Task 4" },
      { task: "Task 5" },
      { task: "Task 6" },
    ];

    // Mock the executionGraph to simulate success
    const mockBatch = jest.fn().mockResolvedValue([{ result: "Success" }]);
    engine.executionGraph = {
      batch: mockBatch,
    };

    // Mock planning graph to return our list of tasks
    engine.planningGraph = {
      invoke: jest.fn().mockResolvedValue({
        architecture_plan: "test arch plan",
        tasks: tasks,
      }),
    };

    // Spy on the triggerAgent to see if @dispatcher is called
    const triggerAgentSpy = jest.spyOn(engine, "triggerAgent");
    triggerAgentSpy.mockImplementation(async (agentId, prompt) => {
      if (agentId === "@dispatcher") {
        console.log("Mocked @dispatcher call with prompt:", prompt);
        return { tasks: null }; // No changes
      }
      if (agentId === "context_preparer") {
        return "context package";
      }
      return `Result from ${agentId}`;
    });

    const config = {
      configurable: {
        thread_id: "test-thread-replan",
      },
    };

    // Run the graph
    await engine.graph.invoke(
      {
        goal: "Test goal for re-planning",
        user_feedback: "proceed",
      },
      config
    );

    // Assertions
    // 1. executionGraph.batch was called once
    expect(mockBatch).toHaveBeenCalledTimes(1);

    // 2. @dispatcher agent was triggered
    expect(triggerAgentSpy).toHaveBeenCalledWith(
      "@dispatcher",
      expect.stringContaining("We have completed 6 tasks.")
    );

    // Restore mocks
    triggerAgentSpy.mockRestore();
  });
});
