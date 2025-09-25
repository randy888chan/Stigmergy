import { mock, describe, test, expect, beforeEach } from 'bun:test';

import { jest } from "bun:test";
// Mock the dependencies correctly
const mockGraphStateManagerInstance = {
  getState: jest.fn(),
  updateState: jest.fn(),
  emit: jest.fn(),
  on: jest.fn(),
};
mock.module("../../../src/infrastructure/state/GraphStateManager.js", () => ({
  __esModule: true,
  default: mockGraphStateManagerInstance,
}));
mock.module("../../../engine/verification_system.js", () => ({
  verifyMilestone: mock(),
}));

// Import the module to be tested AFTER mocks are set up
import * as stateManager from "../../../engine/state_manager.js";

describe("Engine State Manager", () => {
  beforeEach(() => {
    mock.restore(); // This cleans up all mocks before each test
  });

  test("updateTaskStatus should update the status of an existing task", async () => {
    mockGraphStateManagerInstance.getState.mockResolvedValue({
        project_manifest: { tasks: [{ id: "task-1", status: "PENDING" }] },
        history: [],
    });
    await stateManager.updateTaskStatus({ taskId: "task-1", newStatus: "COMPLETED" });
    expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith(
      expect.objectContaining({
        project_manifest: expect.objectContaining({
          tasks: [expect.objectContaining({ id: "task-1", status: "COMPLETED" })],
        }),
      })
    );
  });
});