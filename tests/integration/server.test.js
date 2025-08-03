import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { Engine } from "../../engine/server.js";
import * as stateManager from "../../engine/state_manager.js";
import codeIntelligenceService from "../../services/code_intelligence_service.js";

// Mock the core logic modules
jest.mock("../../engine/state_manager.js");
jest.mock("../../services/code_intelligence_service.js");

describe("API Server Integration Tests", () => {
  let app;
  let engine;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock the engine's start method to prevent the loop from running
    jest.spyOn(Engine.prototype, "start").mockImplementation(() => {});

    engine = new Engine();
    app = engine.app; // Get the express app from the engine instance
  });

  describe("POST /api/system/start", () => {
    it("should return 200 and initiate the project", async () => {
      const goal = "Test project goal";
      stateManager.initializeProject.mockResolvedValue(undefined);
      codeIntelligenceService.scanAndIndexProject.mockResolvedValue(undefined);

      const response = await request(app).post("/api/system/start").send({ goal });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Project initiated.");
      expect(stateManager.initializeProject).toHaveBeenCalledWith(goal);
      expect(engine.start).toHaveBeenCalled();
    });

    it("should return 400 if goal is not provided", async () => {
      const response = await request(app).post("/api/system/start").send({});
      expect(response.status).toBe(400);
    });
  });

  describe("POST /api/control/pause", () => {
    it("should return 200 and pause the engine", async () => {
      // Mock the engine's stop method for this test
      jest.spyOn(Engine.prototype, "stop").mockImplementation(() => {});
      stateManager.pauseProject.mockResolvedValue(undefined);

      const response = await request(app).post("/api/control/pause").send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Engine has been paused.");
      expect(engine.stop).toHaveBeenCalledWith("Paused by user");
      expect(stateManager.pauseProject).toHaveBeenCalled();
    });
  });

  describe("POST /api/control/resume", () => {
    it("should return 200 and resume the engine", async () => {
      stateManager.resumeProject.mockResolvedValue(undefined);

      const response = await request(app).post("/api/control/resume").send();

      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Engine has been resumed.");
      expect(stateManager.resumeProject).toHaveBeenCalled();
      expect(engine.start).toHaveBeenCalled();
    });
  });
});
