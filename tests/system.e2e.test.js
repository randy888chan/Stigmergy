import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { Engine } from "../engine/server.js";
import { execute as executeTool } from "../engine/tool_executor.js";
import "./setup.js";

jest.setTimeout(45000);

describe("Stigmergy System E2E Test", () => {
  let tempProjectDir;
  const originalCwd = process.cwd();
  let server;
  let engine;
  let triggerAgentSpy;

  beforeAll(async () => {
    engine = new Engine();
    server = engine.app.listen();

    tempProjectDir = await fs.mkdtemp(path.join(os.tmpdir(), "stigmergy-e2e-"));
    process.chdir(tempProjectDir);

    const coreTemplatePath = path.join(originalCwd, ".stigmergy-core");
    await fs.copy(coreTemplatePath, path.join(tempProjectDir, ".stigmergy-core"));

    await fs.ensureDir(path.join(tempProjectDir, ".ai"));
    await fs.ensureDir(path.join(tempProjectDir, "docs"));
  });

  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});

    let mockCallCount = 0;
    triggerAgentSpy = jest
      .spyOn(engine, "triggerAgent")
      .mockImplementation(async (agentId, prompt) => {
        console.log(`[MOCK] Intercepted call to agent: ${agentId}`);
        try {
          if (agentId === "dispatcher") {
            mockCallCount++;
            if (mockCallCount === 1) {
              await executeTool("system.updateStatus", {
                status: "GRAND_BLUEPRINT_PHASE",
                artifact_created: "brief",
              });
              await new Promise(resolve => setTimeout(resolve, 100));
            } else if (mockCallCount === 2) {
              await executeTool("system.updateStatus", {
                status: "GRAND_BLUEPRINT_PHASE",
                artifact_created: "prd",
              });
              await new Promise(resolve => setTimeout(resolve, 100));
            } else if (mockCallCount === 3) {
              await executeTool("system.updateStatus", {
                status: "AWAITING_EXECUTION_APPROVAL",
                artifact_created: "architecture",
              });
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          return "Mock agent action completed.";
        } catch (e) {
          console.error(`[MOCK] Error during mocked execution for ${agentId}:`, e); // Keep this for debugging
          await engine.stop("Error in mock");
          return "Mock agent action failed.";
        }
      });
  });

  // --- FINAL FIX: Remove the 'done' callback from the async function signature ---
  afterAll(async () => {
    await engine.stop("Test suite finished");
    process.chdir(originalCwd);
    await fs.remove(tempProjectDir);
    // Let server.close() signal Jest that it's done.
    await new Promise((resolve) => server.close(resolve));
    jest.restoreAllMocks();
  });

  it("should initialize a project and run the autonomous planning phase", async () => {
    const projectGoal = "Build a simple URL shortener service";

    const response = await request(server).post("/api/system/start").send({ goal: projectGoal });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe("Project initiated.");

    const stateFilePath = path.join(tempProjectDir, ".ai", "state.json");
    let currentState;
    let attempts = 0;
    const maxAttempts = 80; // Increase attempts slightly for CI environments

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await fs.pathExists(stateFilePath)) {
        try {
          currentState = await fs.readJson(stateFilePath);
          if (currentState.project_status === "AWAITING_EXECUTION_APPROVAL") {
            break;
          }
        } catch (e) {
          // Ignore intermittent read errors
        }
      }
      attempts++;
    }

    expect(currentState).toBeDefined();
    expect(currentState.project_status).toBe("AWAITING_EXECUTION_APPROVAL");
    expect(currentState.artifacts_created.brief).toBe(true);
    expect(currentState.artifacts_created.prd).toBe(true);
    expect(currentState.artifacts_created.architecture).toBe(true);

    expect(triggerAgentSpy).toHaveBeenCalledWith("dispatcher", expect.any(String));
  });
});
