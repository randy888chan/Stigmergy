import { mock, describe, test, expect, afterEach } from 'bun:test';
import { EventEmitter } from 'events';

// Mock the downstream dependencies using the ESM-compatible API

// Create a mock that extends EventEmitter, just like the original, but without using require()
class MockStateManager extends EventEmitter {
  constructor() {
    super();
    this.getState = mock();
    this.updateState = mock();
  }
}
const mockStateManagerInstance = new MockStateManager();

mock.module("../../../src/infrastructure/state/GraphStateManager.js", () => ({
  __esModule: true,
  default: mockStateManagerInstance,
}));

mock.module("../../../engine/verification_system.js", () => ({
  verifyMilestone: mock(),
}));

// Now, we can dynamically import the modules under test
const {
  getState,
  updateState,
  initializeProject,
  updateStatus,
  transitionToState,
  updateTaskStatus,
} = await import("../../../engine/state_manager.js");
const { verifyMilestone } = await import("../../../engine/verification_system.js");
const stateManager = (await import("../../../src/infrastructure/state/GraphStateManager.js")).default;


describe("Engine State Manager", () => {
  afterEach(() => {
    mock.restore();
  });

  test("getState should call the graph state manager", async () => {
    stateManager.getState.mockResolvedValue({ status: "idle" });
    const state = await getState();
    expect(stateManager.getState).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ status: "idle" });
  });

  test("updateState should pass the event to the graph state manager", async () => {
    const event = { type: "TEST_EVENT" };
    stateManager.updateState.mockResolvedValue({ status: "updated" });
    await updateState(event);
    expect(stateManager.updateState).toHaveBeenCalledWith(event);
  });

  test("initializeProject should create a PROJECT_INITIALIZED event", async () => {
    const goal = "Build a new feature";
    stateManager.updateState.mockResolvedValue({ status: "initialized" });
    await initializeProject(goal);
    expect(stateManager.updateState).toHaveBeenCalledWith({
      type: "PROJECT_INITIALIZED",
      goal,
      project_status: "ENRICHMENT_PHASE",
    });
  });

  test("updateStatus should create a STATUS_UPDATED event", async () => {
    const newStatus = "PLANNING_PHASE";
    const message = "Moving to planning";
    stateManager.updateState.mockResolvedValue({ status: "updated" });
    await updateStatus({ newStatus, message });
    expect(stateManager.updateState).toHaveBeenCalledWith({
      type: "STATUS_UPDATED",
      project_status: newStatus,
      message,
    });
  });

  describe("transitionToState", () => {
    test("should update status if verification passes", async () => {
      verifyMilestone.mockResolvedValue({ success: true });
      stateManager.updateState.mockResolvedValue({ status: "transitioned" });
      await transitionToState("NEW_STATE", "milestone-1");
      expect(verifyMilestone).toHaveBeenCalledWith("milestone-1");
      expect(stateManager.updateState).toHaveBeenCalledWith({
        type: "STATUS_UPDATED",
        project_status: "NEW_STATE",
        message: undefined, // because it's not passed
      });
    });

    test("should halt if verification fails", async () => {
      verifyMilestone.mockResolvedValue({ success: false });
      stateManager.updateState.mockResolvedValue({ status: "halted" });
      await transitionToState("NEW_STATE", "milestone-1");
      expect(verifyMilestone).toHaveBeenCalledWith("milestone-1");
      expect(stateManager.updateState).toHaveBeenCalledWith({
        type: "STATUS_UPDATED",
        project_status: "EXECUTION_HALTED",
        message: "Verification failed for: milestone-1",
      });
    });
  });

  describe("updateTaskStatus", () => {
    const mockState = {
      project_name: "test-project",
      project_manifest: {
        tasks: [
          { id: "task-1", status: "PENDING" },
          { id: "task-2", status: "PENDING" },
        ],
      },
      history: [],
    };

    test("should update the status of an existing task", async () => {
      stateManager.getState.mockResolvedValue(mockState);
      stateManager.updateState.mockResolvedValue({ status: "task-updated" });
      await updateTaskStatus({ taskId: "task-1", newStatus: "COMPLETED" });

      const updatedTasks = [
        { id: "task-1", status: "COMPLETED" },
        { id: "task-2", status: "PENDING" },
      ];

      const eventMatcher = expect.objectContaining({
        type: "TASK_STATUS_UPDATED",
        project_manifest: expect.objectContaining({ tasks: updatedTasks }),
      });

      expect(stateManager.updateState).toHaveBeenCalledWith(eventMatcher);
    });

    test("should not update if the task ID is not found", async () => {
      stateManager.getState.mockResolvedValue(mockState);
      await updateTaskStatus({ taskId: "non-existent-task", newStatus: "COMPLETED" });
      expect(stateManager.updateState).not.toHaveBeenCalled();
    });
  });
});
