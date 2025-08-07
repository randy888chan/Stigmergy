import {
  getState,
  updateState,
  initializeProject,
  updateStatus,
  updateTaskStatus,
} from "../../engine/state_manager.js";

describe("State Manager", () => {
  test("functions should be defined", () => {
    expect(getState).toBeDefined();
    expect(updateState).toBeDefined();
    expect(initializeProject).toBeDefined();
    expect(updateStatus).toBeDefined();
    expect(updateTaskStatus).toBeDefined();
  });
});
