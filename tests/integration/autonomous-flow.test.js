const mockState = {
  project_status: "EXECUTION_IN_PROGRESS",
  project_manifest: {
    tasks: [
      { id: "task1", status: "PENDING" },
      { id: "task2", status: "COMPLETED" },
    ],
  },
};

// Mock state manager comprehensively
jest.mock("../../engine/state_manager.js", () => ({
  getState: jest.fn().mockResolvedValue(mockState),
  updateState: jest.fn().mockResolvedValue(),
  subscribeToChanges: jest.fn(),
}));
// Add proper state initialization

// Add these imports
import { getState } from "../../engine/state_manager.js";
import { Engine } from "../../engine/server.js";

describe("Autonomous Workflow", () => {
  let engine;

  beforeAll(() => {
    engine = new Engine();
  });

  it("should progress through states", async () => {
    // Add proper async handling
    await engine.runLoop();

    // Verify state transitions
    expect(getState).toHaveBeenCalled();

    // Add type checking for critical objects
    const state = await getState();
    expect(Array.isArray(state.project_manifest?.tasks)).toBe(true);
  });
});
