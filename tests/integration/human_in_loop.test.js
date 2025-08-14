// tests/integration/human_in_loop.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";
import { MemorySaver } from "@langchain/langgraph";

jest.mock("../../engine/state_manager.js");

describe("Human-in-the-Loop Workflow", () => {
  test("should interrupt graph when approval is required", async () => {
    const memory = new MemorySaver();
    const engine = new Engine(memory);
    engine.triggerAgent = jest.fn();
    stateManager.getState.mockResolvedValue({ project_status: "GRAND_BLUEPRINT_PHASE" });
    engine.triggerAgent.mockResolvedValue(
      JSON.stringify({ requires_human_approval: true, execution_plan: [] })
    );

    const threadId = "test-thread-hil-123";
    const result = await engine.graph.invoke(
      { agent_history: [], recursion_level: 0 },
      { configurable: { thread_id: threadId } }
    );

    expect(result).toHaveProperty("__interrupt__");
  });
});
