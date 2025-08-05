import { jest, describe, it, expect, beforeEach, beforeAll } from "@jest/globals";
import request from "supertest";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";
import * as llm_adapter from "../../engine/llm_adapter.js";

// Mock the core logic modules
jest.mock("../../engine/state_manager.js");
jest.mock("../../engine/llm_adapter.js");
jest.mock("../../services/code_intelligence_service.js", () => ({
  testConnection: jest.fn().mockResolvedValue({ success: true }),
  enableIncrementalIndexing: jest.fn().mockResolvedValue(undefined),
  scanAndIndexProject: jest.fn().mockResolvedValue(undefined),
}));

describe("Stigmergy Engine API", () => {
  let app;
  let engine;

  beforeEach(() => {
    jest.clearAllMocks();

    // --- FIX: Explicitly mock the functions within stateManager ---
    jest.spyOn(stateManager, "initializeProject").mockResolvedValue(undefined);
    jest.spyOn(stateManager, "getState").mockResolvedValue({ project_status: "TESTING" });
    // ---

    engine = new Engine();
    app = engine.app;
    // Mock methods on the specific instance
    jest.spyOn(engine, "start").mockImplementation(() => {});
    jest.spyOn(engine, "stop").mockImplementation(async () => {});
    jest.spyOn(engine, "triggerAgent").mockImplementation(async (agentId, prompt) => {
      if (agentId === "system") {
        return engine.executeTool("system.executeCommand", { command: prompt }, "system");
      }
      return `Response from ${agentId}`;
    });
  });

  it("should show engine status", async () => {
    const response = await request(app).get("/");
    expect(response.status).toBe(200);
    expect(response.body.status).toContain("Stigmergy Engine is running");
  });

  describe("Dashboard", () => {
    it("should return simplified state", async () => {
      const mockState = {
        project_name: "Test Project",
        project_status: "RUNNING",
        current_task: "Doing something",
        project_manifest: {
          tasks: [{ status: "DONE" }, { status: "IN_PROGRESS" }],
        },
      };
      stateManager.getState.mockResolvedValue(mockState);

      const response = await request(app).get("/dashboard/state");
      expect(response.status).toBe(200);
      expect(response.body.simplified).toEqual({
        project: "Test Project",
        status: "RUNNING",
        progress: "1/2",
        current: "Doing something",
      });
    });
  });

  describe("System Health", () => {
    it("should return system health", async () => {
      const response = await request(app).get("/api/system/health");
      expect(response.status).toBe(200);
      expect(response.body.engine).toBe("RUNNING");
    });
  });

  describe("/api/chat with system agent", () => {
    it("should start a project", async () => {
      const goal = "Build a new world";
      const response = await request(app)
        .post("/api/chat")
        .send({ agentId: "system", prompt: `start project ${goal}` });

      expect(response.status).toBe(200);
      expect(stateManager.initializeProject).toHaveBeenCalledWith(goal);
      expect(engine.start).toHaveBeenCalled();
    });

    it("should pause the engine", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ agentId: "system", prompt: "pause" });

      expect(response.status).toBe(200);
      expect(engine.stop).toHaveBeenCalledWith("Paused by user");
    });

    it("should resume the engine", async () => {
      const response = await request(app)
        .post("/api/chat")
        .send({ agentId: "system", prompt: "resume" });

      expect(response.status).toBe(200);
      expect(engine.start).toHaveBeenCalled();
    });

    it("should return the status", async () => {
      const mockState = { project_status: "TESTING" };
      stateManager.getState.mockResolvedValue(mockState);

      const response = await request(app)
        .post("/api/chat")
        .send({ agentId: "system", prompt: "status" });

      expect(response.status).toBe(200);
      expect(stateManager.getState).toHaveBeenCalled();
      const responseData = JSON.parse(response.body.response);
      expect(responseData).toEqual({ project_status: "TESTING" });
    });
  });
});
