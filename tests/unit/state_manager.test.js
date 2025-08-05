import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import fs from "fs-extra";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { v4 as uuidv4 } from "uuid";
import * as stateManager from "../../engine/state_manager.js";

// Mock the dependencies
jest.mock("fs-extra");
jest.mock("sqlite");
jest.mock("sqlite3");
jest.mock("uuid");

describe("State Manager", () => {
  let mockDb;
  let defaultState;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock the database
    mockDb = {
      get: jest.fn(),
      run: jest.fn(),
      exec: jest.fn(),
    };
    open.mockResolvedValue(mockDb);

    // Mock the default state template
    defaultState = {
      project_name: "",
      goal: "",
      project_status: "NEW",
      history: [{ timestamp: "initial" }], // Ensure history has an entry
      artifacts_created: {
        brief: false,
        prd: false,
        architecture: false,
      },
      status_before_pause: null,
    };
    fs.readJson.mockResolvedValue(JSON.parse(JSON.stringify(defaultState))); // Deep copy
    fs.pathExists.mockResolvedValue(true); // Assume template exists
    uuidv4.mockReturnValue("mock-uuid-1234");
  });

  describe("initializeProject", () => {
    it("should create an initial state from a goal", async () => {
      const goal = "Build a new world";
      await stateManager.initializeProject(goal);

      // Verify that the state was written to the DB
      expect(mockDb.run).toHaveBeenCalledTimes(1);
      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);

      expect(writtenState.goal).toBe(goal);
      expect(writtenState.project_name).toBe("Build-a-new-world");
      expect(writtenState.project_status).toBe("GRAND_BLUEPRINT_PHASE");
      expect(writtenState.history).toHaveLength(1);
      expect(writtenState.history[0].message).toBe(`Project initialized: ${goal}`);
      expect(writtenState.history[0].id).toBe("mock-uuid-1234");
    });
  });

  describe("getState", () => {
    it("should return the default state if no state in DB", async () => {
      mockDb.get.mockResolvedValue(null); // No state in DB
      const state = await stateManager.getState();

      expect(fs.readJson).toHaveBeenCalledWith(expect.stringContaining("state-tmpl.json"));
      expect(mockDb.run).toHaveBeenCalledTimes(1); // Should save the default state
      expect(state.project_status).toBe("NEW");
      // Check that the timestamp was updated
      expect(state.history[0].timestamp).not.toBe("initial");
    });

    it("should return the existing state if a state is in the DB", async () => {
      const existingState = { project_status: "IN_PROGRESS" };
      mockDb.get.mockResolvedValue({ value: JSON.stringify(existingState) });

      const state = await stateManager.getState();
      expect(fs.readJson).not.toHaveBeenCalled();
      expect(state.project_status).toBe("IN_PROGRESS");
    });
  });

  describe("updateState", () => {
    it("should write the new state to the DB", async () => {
      const newState = { project_status: "UPDATED" };
      await stateManager.updateState(newState);
      expect(mockDb.run).toHaveBeenCalledWith(
        "INSERT OR REPLACE INTO state (key, value) VALUES (?, ?)",
        "current",
        JSON.stringify(newState, null, 2)
      );
    });
  });

  describe("updateStatus", () => {
    it("should update the project status and add a history entry", async () => {
      const initialState = { history: [], artifacts_created: {} };
      mockDb.get.mockResolvedValue({ value: JSON.stringify(initialState) });

      await stateManager.updateStatus({ newStatus: "TEST_STATUS", message: "Test message" });

      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);
      expect(writtenState.project_status).toBe("TEST_STATUS");
      expect(writtenState.history).toHaveLength(1);
      expect(writtenState.history[0].message).toBe("Test message");
    });

    it("should mark an artifact as created", async () => {
      const initialState = { history: [], artifacts_created: { brief: false } };
      mockDb.get.mockResolvedValue({ value: JSON.stringify(initialState) });

      await stateManager.updateStatus({ newStatus: "ARTIFACT_DONE", artifact_created: "brief" });

      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);
      expect(writtenState.artifacts_created.brief).toBe(true);
    });
  });

  describe("pauseProject", () => {
    it("should set the status to PAUSED_BY_USER and save the previous state", async () => {
      const initialState = { project_status: "EXECUTION_IN_PROGRESS", history: [] };
      mockDb.get.mockResolvedValue({ value: JSON.stringify(initialState) });

      await stateManager.pauseProject();

      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);
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
      mockDb.get.mockResolvedValue({ value: JSON.stringify(initialState) });

      await stateManager.resumeProject();

      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);
      expect(writtenState.project_status).toBe("EXECUTION_IN_PROGRESS");
      expect(writtenState.status_before_pause).toBeNull();
    });

    it("should default to GRAND_BLUEPRINT_PHASE if no previous status exists", async () => {
      const initialState = { project_status: "PAUSED_BY_USER", history: [] };
      mockDb.get.mockResolvedValue({ value: JSON.stringify(initialState) });
      await stateManager.resumeProject();
      const writtenState = JSON.parse(mockDb.run.mock.calls[0][2]);
      expect(writtenState.project_status).toBe("GRAND_BLUEPRINT_PHASE");
    });
  });
});
