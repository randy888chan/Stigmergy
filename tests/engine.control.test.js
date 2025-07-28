import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import * as stateManager from "../engine/state_manager.js";

const app = express();
app.use(express.json());

app.post("/api/control/pause", async (req, res) => {
  await stateManager.pauseProject();
  res.json({ message: "Paused" });
});

app.post("/api/control/resume", async (req, res) => {
  await stateManager.resumeProject();
  res.json({ message: "Resumed" });
});

describe("Engine Control API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(stateManager, "pauseProject").mockResolvedValue(undefined);
    jest.spyOn(stateManager, "resumeProject").mockResolvedValue(undefined);
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
