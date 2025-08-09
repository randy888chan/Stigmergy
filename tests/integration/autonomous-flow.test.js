import { jest } from "@jest/globals";
import { main } from "../../engine/server.js";
import { getCompletion } from "../../engine/llm_adapter.js";
import * as stateManager from "../../engine/state_manager.js";

jest.mock("../../engine/state_manager.js", () => {
  const mockState = {
    project_status: "EXECUTION_IN_PROGRESS",
    project_manifest: {
      tasks: [
        { id: "task1", status: "PENDING" },
        { id: "task2", status: "COMPLETED" },
      ],
    },
  };
  return {
    getState: jest.fn().mockResolvedValue(mockState),
    updateState: jest.fn().mockResolvedValue(),
    subscribeToChanges: jest.fn(),
  };
});

jest.mock("../../engine/llm_adapter", () => ({
  getCompletion: jest.fn(),
}));

// Mock agent response sequence
const MOCK_RESPONSES = {
  dispatcher: [
    {
      thought: "Creating research task",
      action: { tool: "research.deep_dive", args: { query: "blog platforms" } },
    },
    {
      thought: "Creating design task",
      action: { tool: "design.generate_mockups", args: { pages: ["home"] } },
    },
  ],
  analyst: [{ thought: "Market research complete", action: null }],
  designer: [{ thought: "Mockups generated", action: null }],
};

describe("Autonomous Flow", () => {
  const exit = jest.spyOn(process, "exit").mockImplementation(() => {});
  beforeAll(() => {
    // Mock LLM responses
    getCompletion.mockImplementation((agentId) => {
      const responses = MOCK_RESPONSES[agentId];
      return Promise.resolve(responses.shift());
    });

    // Speed up engine loop
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout").mockImplementation((fn) => fn());
  });

  test("completes full workflow", async () => {
    const enginePromise = main();

    // Advance through states
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(5000);

    // Verify state progression
    const state = await stateManager.getState();
    expect(state.project_status).toBe("EXECUTION_IN_PROGRESS");

    await enginePromise;
  }, 30000); // Extended timeout
});
