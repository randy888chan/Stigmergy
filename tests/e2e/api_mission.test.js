import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { spawn } from "bun";
import fs from "fs-extra";
import path from "path";

const PM2_PROCESS_NAME = "stigmergy-mock";
const MOCK_SERVER_URL = "http://localhost:3011";

// Helper function to poll an async condition
const poll = async (fn, timeout, interval) => {
  const endTime = new Date().getTime() + timeout;

  const checkCondition = async (resolve, reject) => {
    try {
      const result = await fn();
      if (result) {
        resolve(result);
      } else if (new Date().getTime() < endTime) {
        setTimeout(() => checkCondition(resolve, reject), interval);
      } else {
        reject(new Error("Polling timed out waiting for condition."));
      }
    } catch (e) {
      if (new Date().getTime() < endTime) {
        setTimeout(() => checkCondition(resolve, reject), interval);
      } else {
        reject(new Error(`Polling timed out with error: ${e.message}`));
      }
    }
  };

  return new Promise(checkCondition);
};

describe("API-Level E2E Test", () => {
  let server;

  beforeAll(async () => {
    server = spawn(["bun", "run", "start:mock"], {
      stdio: ["ignore", "pipe", "pipe"],
    });

    const reader = server.stdout.getReader();
    const decoder = new TextDecoder();
    let output = "";

    // Wait for the server to log the startup message
    await new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("Server startup timed out")), 30000);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        output += decoder.decode(value);
        if (output.includes("Stigmergy engine is running")) {
          clearTimeout(timeout);
          resolve();
          break;
        }
      }
    });
  }, 35000);

  afterAll(async () => {
    if (server) {
      server.kill();
      await server.exited;
    }
  });

  test("should transition to PLANNING_PHASE after a mission briefing", async () => {
    const mission = {
      missionTitle: "E2E Test Mission",
      userStories: "- As a user, I want this test to pass.",
      acceptanceCriteria: "- The system state becomes PLANNING_PHASE.",
    };

    const response = await fetch(`${MOCK_SERVER_URL}/api/mission/briefing`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mission),
    });

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.message).toBe("Mission briefing received and initiated successfully.");

    // Poll the /api/state endpoint until the status is PLANNING_PHASE
    const finalState = await poll(
      async () => {
        const stateResponse = await fetch(`${MOCK_SERVER_URL}/api/state`);
        if (!stateResponse.ok) return false;
        const state = await stateResponse.json();
        return state.project_status === "PLANNING_PHASE" ? state : false;
      },
      30000, // 30-second timeout
      1000   // 1-second interval
    );

    expect(finalState).toBeTruthy();
    expect(finalState.project_status).toBe("PLANNING_PHASE");
    expect(finalState.message).toBe("Handoff to @specifier complete.");

  }, 35000);
});
