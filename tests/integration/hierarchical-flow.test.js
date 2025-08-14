// In tests/integration/hierarchical-flow.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as deepAgentTool from "../../tools/deep_agent_tool.js";
import * as stateManager from "../../engine/state_manager.js";

jest.mock("../../tools/deep_agent_tool.js");
jest.mock("../../engine/state_manager.js");

describe("Hierarchical Agent Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock state manager to allow the graph to run
    stateManager.getState.mockResolvedValue({ project_status: "EXECUTION_IN_PROGRESS" });
  });

  it("should allow a Mastermind agent to spawn and receive a result from a team", async () => {
    const engine = new Engine(new (jest.requireActual("@langchain/langgraph").MemorySaver)());

    // Mock the dispatcher to return a plan once, then an empty plan to terminate the loop.
    const dispatcherMock = jest
      .fn()
      .mockResolvedValueOnce(
        JSON.stringify({
          execution_plan: [{ agent: "orion", prompt: "Build a SaaS app." }],
        })
      )
      .mockResolvedValue(JSON.stringify({ execution_plan: [] }));

    // Mock the agent trigger to use our dispatcher mock
    engine.triggerAgent = jest.fn().mockImplementation(async (agentId) => {
      if (agentId === "dispatcher") {
        return dispatcherMock();
      }
      if (agentId === "orion") {
        // The Orion agent calls the deep_agent_tool
        return await deepAgentTool.spawnTeam({
          goal: "Build a SaaS app.",
          agents: ["@pm", "@dev"],
        });
      }
    });

    // Mock the final result from the spawned team
    deepAgentTool.spawnTeam.mockResolvedValue("SaaS app built successfully.");

    await engine.graph.invoke(
      { agent_history: [], recursion_level: 0, project_goal: "Build a SaaS app." },
      { configurable: { thread_id: "hierarchical-test-thread" } }
    );

    // Verify that the hierarchical agent tool was called, which is the main point of this test.
    expect(deepAgentTool.spawnTeam).toHaveBeenCalled();
  });
});
