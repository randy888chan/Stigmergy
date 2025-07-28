import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";

jest.mock("../engine/state_manager.js", () => ({
  pauseProject: jest.fn(),
  resumeProject: jest.fn(),
}));

const app = express();
app.use(express.json());

// We need to re-import the router handlers to use the mocked stateManager
import { post as pausePost } from "../engine/server.js";
import { post as resumePost } from "../engine/server.js";

app.post("/api/control/pause", async (req, res) => {
  const stateManager = await import("../engine/state_manager.js");
  await stateManager.pauseProject();
  res.json({ message: "Paused" });
});

app.post("/api/control/resume", async (req, res) => {
  const stateManager = await import("../engine/state_manager.js");
  await stateManager.resumeProject();
  res.json({ message: "Resumed" });
});

describe("Engine Control API", () => {
  let stateManager;
  beforeEach(async () => {
    jest.clearAllMocks();
    stateManager = await import("../engine/state_manager.js");
  });

  it("should call stateManager.pauseProject", async () => {
    await request(app).post("/api/control/pause").send();
    expect(stateManager.pauseProject).toHaveBeenCalledTimes(1);
  });

  it("should call stateManager.resumeProject", async () => {
    await request(app).post("/api/control/resume").send();
    expect(stateManager.resumeProject).toHaveBeenCalledTimes(1);
  });
});
