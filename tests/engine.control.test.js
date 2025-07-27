const stateManager = require("../engine/state_manager");
const serverLogic = require("../engine/server"); // Assuming server logic can be imported for testing
const request = require("supertest");
const express = require("express");

// Mock the state manager to control the state file in memory for tests
jest.mock("../engine/state_manager");

// We need a minimal express app to test the API endpoints
const app = express();
app.use(express.json());
app.post("/api/control/pause", (req, res) => {
    stateManager.pauseProject();
    res.json({ message: "Engine paused." });
});
app.post("/api/control/resume", (req, res) => {
    stateManager.resumeProject();
    res.json({ message: "Engine resumed." });
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
    expect(response.body.message).toBe("Engine paused.");
    expect(stateManager.pauseProject).toHaveBeenCalledTimes(1);
  });

  it("should call stateManager.resumeProject when /api/control/resume is hit", async () => {
    const response = await request(app).post("/api/control/resume").send();

    expect(response.statusCode).toBe(200);
    expect(response.body.message).toBe("Engine resumed.");
    expect(stateManager.resumeProject).toHaveBeenCalledTimes(1);
  });
});
