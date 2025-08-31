import {
  getState,
  updateState,
  initializeProject,
  updateStatus,
  transitionToState,
  updateTaskStatus,
} from "../../../engine/state_manager.js";
import stateManager from "../../../src/infrastructure/state/GraphStateManager.js";
import { verifyMilestone } from "../../../engine/verification_system.js";

// Mock the downstream dependencies
jest.mock("../../../src/infrastructure/state/GraphStateManager.js", () => ({
  getState: jest.fn(),
  updateState: jest.fn(),
}));

jest.mock("../../../engine/verification_system.js", () => ({
  verifyMilestone: jest.fn(),
}));

describe("Engine State Manager", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test("getState should call the graph state manager", async () => {
    stateManager.getState.mockResolvedValue({ status: "idle" });
    const state = await getState();
    expect(stateManager.getState).toHaveBeenCalledTimes(1);
    expect(state).toEqual({ status: "idle" });
  });

  test("updateState should pass the event to the graph state manager", async () => {
    const event = { type: "TEST_EVENT" };
    await updateState(event);
    expect(stateManager.updateState).toHaveBeenCalledWith(event);
  });

  test("initializeProject should create a PROJECT_INITIALIZED event", async () => {
    const goal = "Build a new feature";
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
