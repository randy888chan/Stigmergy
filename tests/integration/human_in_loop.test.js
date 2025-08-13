// tests/integration/human_in_loop.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";

jest.mock("../../engine/state_manager.js");

describe("Human-in-the-Loop Workflow", () => {
  test("should interrupt graph when approval is required", async () => {
    const engine = new Engine();
    engine.triggerAgent = jest.fn();
    stateManager.getState.mockResolvedValue({ project_status: "GRAND_BLUEPRINT_PHASE" });
    engine.triggerAgent.mockResolvedValue(JSON.stringify({ requires_human_approval: true }));

    const config = { configurable: { thread_id: "test-thread" } };
    const result = await engine.graph.invoke({ agent_history: [], recursion_level: 0 }, config);

    expect(result).toBeInstanceOf(Interrupt);
  });
});
