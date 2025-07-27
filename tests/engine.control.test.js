const request = require("supertest");
const express = require("express");
const stateManager = require("../engine/state_manager");

// Mock the state_manager module
jest.mock("../engine/state_manager", () => ({
  pauseProject: jest.fn().mockResolvedValue(),
  resumeProject: jest.fn().mockResolvedValue(),
}));

// We need a minimal express app to test the API endpoints
const app = express();
app.use(express.json());

// Manually define the routes from server.js for this test
app.post("/api/control/pause", async (req, res) => {
    await stateManager.pauseProject();
    res.json({ message: "Engine has been paused." });
});
app.post("/api/control/resume", async (req, res) => {
    await stateManager.resumeProject();
    res.json({ message: "Engine has been resumed." });
});

describe("Engine Control API", () => {
  beforeEach(() => {
    // Reset mocks before each test
    stateManager.pauseProject.mockClear();
    stateManager.resumeProject.mockClear();
  });

  it("should call stateManager.pauseProject when /api/control/pause is hit", async () => {
    const response = await request(app).post("/api/control/pause").send();
    
    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Engine has been paused.");
    expect(stateManager.pauseProject).toHaveBeenCalledTimes(1);
  });

  it("should call stateManager.resumeProject when /api/control/resume is hit", async () => {
    const response = await request(app).post("/api/control/resume").send();

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Engine has been resumed.");
    expect(stateManager.resumeProject).toHaveBeenCalledTimes(1);
  });
});
