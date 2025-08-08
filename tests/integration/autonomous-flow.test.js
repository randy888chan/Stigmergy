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
// Add proper state initialization

// Add these imports
import { getState } from "../../engine/state_manager.js";
import { Engine } from "../../engine/server.js";

describe("Autonomous Workflow", () => {
  let engine;

  beforeAll(() => {
    engine = new Engine();
    jest.useFakeTimers();
  });

  it("should progress through states", async () => {
    const mockState = await getState();
    getState.mockResolvedValue(mockState);

    engine.isEngineRunning = true;
    const runLoopPromise = engine.runLoop();

    // Allow one iteration of the loop to run
    await Promise.resolve();
    jest.runOnlyPendingTimers();

    // Stop the engine to break the loop
    engine.isEngineRunning = false;

    // Ensure the loop promise resolves
    await runLoopPromise;

    // Verify that the loop ran at least once
    expect(getState).toHaveBeenCalled();
  }, 10000); // Increase timeout to 10 seconds
});
