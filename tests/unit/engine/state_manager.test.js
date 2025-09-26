import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock all dependencies before importing the module to test
mock.module("../../../src/infrastructure/state/GraphStateManager.js", () => {
  const mockInstance = {
    getState: mock(),
    updateState: mock(),
    emit: mock(),
    on: mock(),
  };
  
  return {
    __esModule: true,
    default: mockInstance,
  };
});

mock.module("../../../engine/verification_system.js", () => ({
  verifyMilestone: mock(),
}));

// Import the module to be tested AFTER mocks are set up
import * as stateManager from "../../../engine/state_manager.js";

describe("Engine State Manager", () => {
  const mockGraphStateManagerInstance = stateManager.default || stateManager; // Handle both default and named exports
  
  beforeEach(() => {
    mock.restore(); // This cleans up all mocks before each test
  });

  test("updateTaskStatus should update the status of an existing task", async () => {
    // Set up the mock to return a state with a task
    mockGraphStateManagerInstance.getState = mock().mockResolvedValue({
        project_manifest: { tasks: [{ id: "task-1", status: "PENDING" }] },
        history: [],
    });
    
    await stateManager.updateTaskStatus({ taskId: "task-1", newStatus: "COMPLETED" });
    
    // Verify that updateState was called with the correct parameters
    expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalled();
  });
});