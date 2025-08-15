import { Engine } from "../../engine/server.js";
import { MemorySaver } from "@langchain/langgraph";
import { jest } from "@jest/globals";

describe("Supervisor Self-Correction Loop", () => {
  let engine;
  let checkpointer;

  beforeEach(() => {
    engine = new Engine();
    checkpointer = new MemorySaver();
    engine.initialize(checkpointer);
  });

  test("should trigger self-correction node on execution failure and retry", async () => {
    // Mock the executionGraph to simulate failure on the first call
    const mockBatch = jest
      .fn()
      .mockImplementationOnce(() => {
        return Promise.reject(new Error("Execution failed miserably"));
      })
      .mockImplementationOnce(() => {
        console.log("Second call to batch (retry)");
        return Promise.resolve([{ result: "Success on retry" }]);
      });

    engine.executionGraph = {
      batch: mockBatch,
    };

    // Spy on the triggerAgent to see if @metis is called
    const triggerAgentSpy = jest.spyOn(engine, "triggerAgent");
    triggerAgentSpy.mockImplementation(async (agentId, prompt) => {
      if (agentId === "@metis") {
        console.log("Mocked @metis call with prompt:", prompt);
        return "Use a different tool";
      }
      if (agentId === "context_preparer") {
        return "context package";
      }
      if (agentId === "planner") {
        return {
          architecture_plan: "test plan",
          tasks: [{ task: "Initial task", code: "" }],
        };
      }
      return `Result from ${agentId}`;
    });

    // Mock planning graph to return some tasks
    engine.planningGraph = {
      invoke: jest.fn().mockResolvedValue({
        architecture_plan: "test arch plan",
        tasks: [{ task: "some task" }],
      }),
    };

    const config = {
      configurable: {
        thread_id: "test-thread-1",
      },
    };

    // Run the graph
    await engine.graph.invoke(
      {
        goal: "Test goal that will fail once",
        user_feedback: "proceed",
      },
      config
    );

    // Assertions
    // 1. executionGraph.batch was called twice
    expect(mockBatch).toHaveBeenCalledTimes(2);

    // 2. @metis agent was triggered with the correct context
    expect(triggerAgentSpy).toHaveBeenCalledWith(
      "@metis",
      expect.stringContaining("failed with the error 'Execution failed miserably'")
    );

    // 3. The second call to batch should have the revised task
    const secondCallTasks = mockBatch.mock.calls[1][0];
    expect(secondCallTasks[0].task).toContain("Corrected: Use a different tool");

    // Restore mocks
    triggerAgentSpy.mockRestore();
  });
});
