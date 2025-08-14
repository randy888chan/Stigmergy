// tests/integration/planning_and_execution.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";
import { MemorySaver } from "@langchain/langgraph";

jest.mock("../../engine/state_manager.js");

describe("Proactive Planning and Execution Flow", () => {
  test("should execute a multi-step plan", async () => {
    const memory = new MemorySaver();
    const engine = new Engine(memory);

    let dispatcherCallCount = 0;
    const mockPlan = {
      execution_plan: [
        { agent: "analyst", prompt: "Perform market research." },
        { agent: "dev", prompt: "Implement the login feature." },
      ],
    };
    engine.triggerAgent = jest.fn().mockImplementation(async (agentId) => {
      if (agentId === "dispatcher") {
        dispatcherCallCount++;
        if (dispatcherCallCount === 1) {
          return JSON.stringify(mockPlan);
        } else {
          return JSON.stringify({ execution_plan: [] });
        }
      }
      return `Result from ${agentId}`;
    });

    let getStateCallCount = 0;
    stateManager.getState.mockImplementation(async () => {
      getStateCallCount++;
      // Allow for more execution cycles in the graph
      if (getStateCallCount >= 5) {
        // <-- Changed to 5
        return { project_status: "COMPLETED", end_run: true };
      }
      return { project_status: "EXECUTION_IN_PROGRESS" }; // <-- Changed status
    });

    await engine.graph.invoke(
      { agent_history: [], recursion_level: 0 },
      { configurable: { thread_id: "test-thread-pe-123" } }
    );

    expect(engine.triggerAgent).toHaveBeenCalledTimes(3);
    expect(engine.triggerAgent).toHaveBeenCalledWith("dispatcher", expect.any(String));
    expect(engine.triggerAgent).toHaveBeenCalledWith("analyst", "Perform market research.");
    expect(engine.triggerAgent).toHaveBeenCalledWith("dev", "Implement the login feature.");
  });
});
