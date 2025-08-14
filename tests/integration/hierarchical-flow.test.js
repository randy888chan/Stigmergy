// In tests/integration/hierarchical-flow.test.js
import { jest } from "@jest/globals";
import { Engine } from "../../engine/server.js";
import * as deepAgentTool from "../../tools/deep_agent_tool.js";

jest.mock("../../tools/deep_agent_tool.js");

describe("Hierarchical Agent Flow", () => {
  it("should allow a Mastermind agent to spawn and receive a result from a team", async () => {
    const engine = new Engine(new (jest.requireActual("@langchain/langgraph").MemorySaver)());

    // Mock the dispatcher to call our Mastermind agent
    engine.triggerAgent = jest.fn().mockImplementation(async (agentId) => {
      if (agentId === "dispatcher") {
        return JSON.stringify({
          execution_plan: [{ agent: "orion", prompt: "Build a SaaS app." }],
        });
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

    const finalState = await engine.graph.invoke(
      { messages: [], last_result: null, project_goal: "Build a SaaS app." },
      { configurable: { thread_id: "hierarchical-test-thread" } }
    );

    expect(deepAgentTool.spawnTeam).toHaveBeenCalled();
    expect(finalState.last_result).toContain("SaaS app built successfully.");
  });
});
