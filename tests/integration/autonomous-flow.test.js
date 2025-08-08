// Mock state manager comprehensively
jest.mock("../../engine/state_manager.js", () => ({
  getState: jest.fn(),
  updateState: jest.fn().mockResolvedValue(),
  subscribeToChanges: jest.fn(),
}));

// Add these imports
import { getState } from "../../engine/state_manager.js";
import { Engine } from "../../engine/server.js";
import AgentPerformance from "../../engine/agent_performance.js";

// Mock the entire agent_performance module
jest.mock("../../engine/agent_performance.js");

const mockState = {
  project_status: "EXECUTION_IN_PROGRESS",
  project_manifest: {
    tasks: [
      { id: "task1", status: "PENDING" },
      { id: "task2", status: "COMPLETED" },
    ],
  },
};

describe("Autonomous Workflow", () => {
  let engine;

  beforeEach(() => {
    // Reset mocks and engine before each test
    jest.clearAllMocks();
    engine = new Engine();
    // Provide a mock implementation for the new dependency
    AgentPerformance.getBestAgentForTask.mockResolvedValue("dispatcher");
  });

  it("should call getState within the runLoop and then stop", async () => {
    // Arrange: Mock getState to stop the loop after the first successful call
    getState.mockImplementation(async () => {
      if (engine.isEngineRunning) {
        engine.stop("Test completed");
      }
      return mockState;
    });

    // Act: Start the engine, which will trigger the runLoop
    await engine.start();

    // Assert: Verify that getState was called
    // It will be called once by the loop, and potentially again by assertions.
    expect(getState).toHaveBeenCalled();

    // Also, we can check the state content here.
    const state = await getState();
    expect(Array.isArray(state.project_manifest?.tasks)).toBe(true);
    expect(state.project_status).toBe("EXECUTION_IN_PROGRESS");
  });
});
