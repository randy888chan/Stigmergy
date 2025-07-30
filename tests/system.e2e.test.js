import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from "@jest/globals";
import request from "supertest";
import fs from "fs-extra";
import path from "path";
import os from "os";
import { app, Engine } from "../engine/server.js";
import { execute as executeTool } from "../engine/tool_executor.js";
import "./setup.js";

jest.setTimeout(20000);

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
    triggerAgentSpy = jest
      .spyOn(engine, "triggerAgent")
      .mockImplementation(async (agentId, prompt) => {
        console.log(`[MOCK] Intercepted call to agent: ${agentId}`);

        try {
          if (agentId === "analyst") {
            await executeTool("file_system.writeFile", {
              path: "docs/brief.md",
              content: "Mock brief",
            });
            await executeTool("system.updateStatus", {
              status: "GRAND_BLUEPRINT_PHASE",
              message: "Brief complete.",
              artifact_created: "brief",
            });
          } else if (agentId === "pm") {
            await executeTool("file_system.writeFile", {
              path: "docs/prd.md",
              content: "Mock PRD",
            });
            await executeTool("system.updateStatus", {
              status: "GRAND_BLUEPRINT_PHASE",
              message: "PRD complete.",
              artifact_created: "prd",
            });
          } else if (agentId === "design-architect") {
            await executeTool("file_system.writeFile", {
                path: "docs/architecture.md",
                content: "Mock Architecture",
            });
            await executeTool("system.updateStatus", {
              status: "AWAITING_EXECUTION_APPROVAL",
              message: "Architecture complete.",
              artifact_created: "architecture",
            });
          }
          return "Mock agent action completed.";
        } catch (e) {
          console.error(`[MOCK] Error during mocked execution for ${agentId}:`, e);
          await engine.stop("Error in mock");
          return "Mock agent action failed.";
        }
      });
  });

  afterAll(async (done) => {
    await engine.stop("Test suite finished");
    process.chdir(originalCwd);
    await fs.remove(tempProjectDir);
    server.close(done);
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
    const maxAttempts = 40;

    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      if (await fs.pathExists(stateFilePath)) {
        currentState = await fs.readJson(stateFilePath);
        if (currentState.project_status === "AWAITING_EXECUTION_APPROVAL") {
          break;
        }
      }
      attempts++;
    }

    expect(currentState).toBeDefined();
    expect(currentState.project_status).toBe("AWAITING_EXECUTION_APPROVAL");
    expect(currentState.artifacts_created.brief).toBe(true);
    expect(currentState.artifacts_created.prd).toBe(true);
    expect(currentState.artifacts_created.architecture).toBe(true);

    expect(triggerAgentSpy).toHaveBeenCalledWith("analyst", expect.any(String), null);
    expect(triggerAgentSpy).toHaveBeenCalledWith("pm", expect.any(String), null);
    expect(triggerAgentSpy).toHaveBeenCalledWith("design-architect", expect.any(String), null);
  });
});
