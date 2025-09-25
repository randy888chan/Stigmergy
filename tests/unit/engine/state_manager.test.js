import { mock, describe, test, expect, afterEach, beforeEach } from 'bun:test';

// Mock the downstream dependencies
const mockGraphStateManagerInstance = {
  getState: mock(),
  updateState: mock(),
  on: mock(),
  emit: mock(),
};
mock.module("../../../infrastructure/state/GraphStateManager.js", () => ({
  __esModule: true,
  default: mockGraphStateManagerInstance,
}));

const mockVerifyMilestone = mock();
mock.module("../../../engine/verification_system.js", () => ({
  verifyMilestone: mockVerifyMilestone,
}));

// Import the module under test
import * as stateManager from "../../../engine/state_manager.js";

describe("Engine State Manager", () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockGraphStateManagerInstance.getState.mockReset();
    mockGraphStateManagerInstance.updateState.mockReset();
    mockVerifyMilestone.mockReset();
  });

  test("getState should call the graph state manager", async () => {
    mockGraphStateManagerInstance.getState.mockResolvedValue({ status: "idle" });
    const state = await stateManager.getState();
    expect(mockGraphStateManagerInstance.getState).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ status: "idle" });
  });

  test("updateState should pass the event to the graph state manager", async () => {
    const event = { type: "TEST_EVENT" };
    mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "updated" });
    await stateManager.updateState(event);
    expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith(event);
  });

  test("initializeProject should create a PROJECT_INITIALIZED event", async () => {
    const goal = "Build a new feature";
    mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "initialized" });
    await stateManager.initializeProject(goal);
    expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith({
      type: "PROJECT_INITIALIZED",
      goal,
      project_status: "ENRICHMENT_PHASE",
    });
  });

  test("updateStatus should create a STATUS_UPDATED event", async () => {
    const newStatus = "PLANNING_PHASE";
    const message = "Moving to planning";
    mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "updated" });
    await stateManager.updateStatus({ newStatus, message });
    expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith({
      type: "STATUS_UPDATED",
      project_status: newStatus,
      message,
    });
  });

  describe("transitionToState", () => {
    test("should update status if verification passes", async () => {
      mockVerifyMilestone.mockResolvedValue({ success: true });
      mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "transitioned" });
      await stateManager.transitionToState({ newStatus: "NEW_STATE", milestone: "milestone-1" });
      expect(mockVerifyMilestone).toHaveBeenCalledWith("milestone-1");
      expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith({
        type: "STATUS_UPDATED",
        project_status: "NEW_STATE",
        message: expect.any(String), // Message is now auto-generated
      });
    });

    test("should halt if verification fails", async () => {
      mockVerifyMilestone.mockResolvedValue({ success: false, message: "Something broke" });
      mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "halted" });
      await stateManager.transitionToState({ newStatus: "NEW_STATE", milestone: "milestone-1" });
      expect(mockVerifyMilestone).toHaveBeenCalledWith("milestone-1");
      expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith({
        type: "STATUS_UPDATED",
        project_status: "EXECUTION_HALTED",
        message: "Verification failed for milestone: milestone-1. Reason: Something broke",
      });
    });
  });

  describe("updateTaskStatus", () => {
    test("should update the status of an existing task", async () => {
        mockGraphStateManagerInstance.getState.mockResolvedValue({
            project_manifest: { tasks: [
                { id: "task-1", status: "PENDING" },
                { id: "task-2", status: "PENDING" },
            ]},
            history: [],
        });
        mockGraphStateManagerInstance.updateState.mockResolvedValue({ status: "task-updated" });
        await stateManager.updateTaskStatus({ taskId: "task-1", newStatus: "COMPLETED" });

        const updatedTasks = [
            { id: "task-1", status: "COMPLETED" },
            { id: "task-2", status: "PENDING" },
        ];

        const eventMatcher = expect.objectContaining({
            type: "TASK_STATUS_UPDATED",
            project_manifest: expect.objectContaining({ tasks: updatedTasks }),
        });

        expect(mockGraphStateManagerInstance.updateState).toHaveBeenCalledWith(eventMatcher);
    });

    test("should not update if the task ID is not found", async () => {
        const mockState = {
            project_manifest: { tasks: [{ id: "task-1", status: "PENDING" }] },
            history: [],
        };
      mockGraphStateManagerInstance.getState.mockResolvedValue(mockState);
      await stateManager.updateTaskStatus({ taskId: "non-existent-task", newStatus: "COMPLETED" });
      expect(mockGraphStateManagerInstance.updateState).not.toHaveBeenCalled();
    });
  });
});
