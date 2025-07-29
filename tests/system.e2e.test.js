import { jest, describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import request from "supertest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { app } from "../engine/server.js"; // Import the real app

// Increase timeout for E2E test
jest.setTimeout(30000);

describe("Stigmergy System E2E Test", () => {
  let tempProjectDir;
  const originalCwd = process.cwd();

  beforeAll(async () => {
    // Create a temporary directory for our test project
    tempProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-e2e-"));
    process.chdir(tempProjectDir); // Change CWD to the temp dir

    // Copy the essential .stigmergy-core structure for the test
    const coreTemplatePath = path.join(originalCwd, ".stigmergy-core");
    await fs.copy(coreTemplatePath, path.join(tempProjectDir, ".stigmergy-core"));
    await fs.ensureDir(path.join(tempProjectDir, ".ai"));
  });

  afterAll(async () => {
    process.chdir(originalCwd); // Restore CWD
    await fs.remove(tempProjectDir); // Clean up the temp directory
  });

  it("should initialize a project and run the autonomous planning phase", async () => {
    const projectGoal = "Build a simple URL shortener service";

    // 1. Trigger the system via the real API endpoint
    const response = await request(app)
      .post("/api/system/start")
      .send({ goal: projectGoal });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Project initiated.");

    // 2. Poll the state file to observe the system's autonomous progress
    const stateFilePath = path.join(tempProjectDir, ".ai", "state.json");
    let currentState;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for engine to work
      if (await fs.pathExists(stateFilePath)) {
        currentState = await fs.readJson(stateFilePath);
        // We are looking for the final state of the planning phase
        if (currentState.project_status === "AWAITING_EXECUTION_APPROVAL") {
          break;
        }
      }
      attempts++;
    }

    // 3. Assert the final state
    expect(currentState).toBeDefined();
    expect(currentState.goal).toBe(projectGoal);
    expect(currentState.project_status).toBe("AWAITING_EXECUTION_APPROVAL");

    // 4. Assert that planning artifacts were created
    // (This is a simplified check. A more robust test could check content.)
    expect(await fs.pathExists(path.join(tempProjectDir, "docs/brief.md"))).toBe(true);
    expect(await fs.pathExists(path.join(tempProjectDir, "docs/prd.md"))).toBe(true);
  });
});
