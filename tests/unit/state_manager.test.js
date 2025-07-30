import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import fs from "fs-extra";
import lockfile from "proper-lockfile";
import { v4 as uuidv4 } from "uuid";
import * as stateManager from "../../engine/state_manager.js";

// Mock the dependencies
jest.mock("fs-extra");
jest.mock("proper-lockfile");
jest.mock("uuid");

describe("State Manager", () => {
  let mockState;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the default state template
    const defaultState = {
      project_name: "",
      goal: "",
      project_status: "NEW",
      // FIX: The code expects at least one history entry to exist in the template.
      history: [{ timestamp: "" }],
      artifacts_created: {
        brief: false,
        prd: false,
        architecture: false,
      },
    };
    fs.readJson.mockResolvedValue(defaultState);
    fs.writeJson.mockResolvedValue(undefined);
    fs.ensureDir.mockResolvedValue(undefined);
    lockfile.lock.mockResolvedValue(() => {}); // Mock lock returning a release function
    uuidv4.mockReturnValue("mock-uuid-1234");
  });

  describe("initializeProject", () => {
    it("should create an initial state from a goal", async () => {
      const goal = "Build a new world";
      await stateManager.initializeProject(goal);

      // Verify that writeJson was called with the correct initial state
      expect(fs.writeJson).toHaveBeenCalledTimes(1);
      const writtenState = fs.writeJson.mock.calls[0][1];

      expect(writtenState.goal).toBe(goal);
      expect(writtenState.project_name).toBe("Build-a-new-world");
      expect(writtenState.project_status).toBe("GRAND_BLUEPRINT_PHASE");
      expect(writtenState.history).toHaveLength(1);
      expect(writtenState.history[0].message).toBe(`Project initialized: ${goal}`);
      expect(writtenState.history[0].id).toBe("mock-uuid-1234");
    });
  });

  describe("getState", () => {
    it("should return the default state if no state file exists", async () => {
      fs.pathExists.mockResolvedValue(false);
      const state = await stateManager.getState();
      expect(fs.readJson).toHaveBeenCalledWith(expect.stringContaining("state-tmpl.json"));
      expect(state.project_status).toBe("NEW");
    });

    it("should return the existing state if a state file exists", async () => {
      const existingState = { project_status: "IN_PROGRESS" };
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(existingState);

      const state = await stateManager.getState();
      expect(fs.readJson).toHaveBeenCalledWith(expect.stringContaining("state.json"));
      expect(state.project_status).toBe("IN_PROGRESS");
    });
  });

  describe("updateState", () => {
    it("should write the new state to the file", async () => {
      const newState = { project_status: "UPDATED" };
      await stateManager.updateState(newState);
      expect(lockfile.lock).toHaveBeenCalled();
      expect(fs.writeJson).toHaveBeenCalledWith(expect.any(String), newState, { spaces: 2 });
    });
  });

  describe("updateStatus", () => {
    it("should update the project status and add a history entry", async () => {
      const initialState = { history: [], artifacts_created: {} };
      fs.readJson.mockResolvedValue(initialState); // Mock getState to return a base state

      await stateManager.updateStatus({ newStatus: "TEST_STATUS", message: "Test message" });

      const writtenState = fs.writeJson.mock.calls[0][1];
      expect(writtenState.project_status).toBe("TEST_STATUS");
      expect(writtenState.history).toHaveLength(1);
      expect(writtenState.history[0].message).toBe("Test message");
    });

    it("should mark an artifact as created", async () => {
      const initialState = { history: [], artifacts_created: { brief: false } };
      fs.readJson.mockResolvedValue(initialState);

      await stateManager.updateStatus({ newStatus: "ARTIFACT_DONE", artifact_created: "brief" });

      const writtenState = fs.writeJson.mock.calls[0][1];
      expect(writtenState.artifacts_created.brief).toBe(true);
    });
  });

  describe("pauseProject", () => {
    it("should set the status to PAUSED_BY_USER and save the previous state", async () => {
      const initialState = { project_status: "EXECUTION_IN_PROGRESS", history: [] };
      fs.readJson.mockResolvedValue(initialState);

      await stateManager.pauseProject();

      const writtenState = fs.writeJson.mock.calls[0][1];
      expect(writtenState.project_status).toBe("PAUSED_BY_USER");
      expect(writtenState.status_before_pause).toBe("EXECUTION_IN_PROGRESS");
    });
  });

  describe("resumeProject", () => {
    it("should restore the status from before pause", async () => {
      const initialState = {
        project_status: "PAUSED_BY_USER",
        status_before_pause: "EXECUTION_IN_PROGRESS",
        history: [],
      };
      fs.readJson.mockResolvedValue(initialState);

      await stateManager.resumeProject();

      const writtenState = fs.writeJson.mock.calls[0][1];
      expect(writtenState.project_status).toBe("EXECUTION_IN_PROGRESS");
      expect(writtenState.status_before_pause).toBeNull();
    });

    it("should default to GRAND_BLUEPRINT_PHASE if no previous status exists", async () => {
      const initialState = { project_status: "PAUSED_BY_USER", history: [] };
      fs.readJson.mockResolvedValue(initialState);

      await stateManager.resumeProject();

      const writtenState = fs.writeJson.mock.calls[0][1];
      expect(writtenState.project_status).toBe("GRAND_BLUEPRINT_PHASE");
    });
  });
});
