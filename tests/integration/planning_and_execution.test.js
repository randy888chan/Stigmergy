// tests/integration/planning_and_execution.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";

jest.mock("../../engine/state_manager.js");

describe("Proactive Planning and Execution Flow", () => {
  test("should execute a multi-step plan", async () => {
    const engine = new Engine();
    engine.triggerAgent = jest.fn();
    stateManager.getState.mockResolvedValue({ project_status: "GRAND_BLUEPRINT_PHASE" });

    const mockPlan = {
      execution_plan: [
        { agent: "analyst", prompt: "..." },
        { agent: "dev", prompt: "..." },
      ],
    };
    engine.triggerAgent.mockImplementation(async (agentId) => {
      if (agentId === "dispatcher") return JSON.stringify(mockPlan);
      return `Result from ${agentId}`;
    });

    const config = { configurable: { thread_id: "test-thread" } };
    await engine.graph.invoke({ agent_history: [], recursion_level: 0 }, config);

    expect(engine.triggerAgent).toHaveBeenCalledTimes(3);
    expect(engine.triggerAgent).toHaveBeenCalledWith("dispatcher", expect.any(String));
    expect(engine.triggerAgent).toHaveBeenCalledWith("analyst", "...");
    expect(engine.triggerAgent).toHaveBeenCalledWith("dev", "...");
  });
});
