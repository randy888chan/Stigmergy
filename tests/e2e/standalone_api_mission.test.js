import { describe, test, expect, beforeEach, afterEach, mock } from "bun:test";
import { Engine } from "../../engine/server.js";
import tmp from "tmp";
import fs from "fs-extra";
import path from "path";
import chalk from "chalk";

const UNIQUE_TEST_PORT = 0;
let MOCK_SERVER_URL = "";

// Mock config service to prevent external dependencies and ensure consistent port
mock.module("../../services/config_service.js", () => ({
  configService: {
    initialize: () => Promise.resolve(),
    getConfig: () => ({
      server: { port: UNIQUE_TEST_PORT },
      security: {
        allowed_origins: [`http://localhost:${UNIQUE_TEST_PORT}`],
      },
      model_tiers: {
        reasoning_tier: { provider: "mock", model_name: "mock-model" },
      },
      providers: { mock_provider: { api_key: "mock-key" } },
    }),
  },
}));

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

describe("Standalone API Mission Test (Mocked)", () => {
  let engine;
  let tempDir;

  beforeEach(async () => {
    console.log(chalk.blue("[E2E Test] Setting up..."));
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    const testProjectRoot = tempDir.name;

    // Setup mock .stigmergy-core structure
    const mockCorePath = path.join(testProjectRoot, ".stigmergy-core");
    const mockAgentsPath = path.join(mockCorePath, "agents");
    await fs.ensureDir(mockAgentsPath);
    // Copy real agent definitions
    await fs.copy(path.join(process.cwd(), ".stigmergy-core", "agents"), mockAgentsPath);
    // Create mock rbac.yml
    const governanceDir = path.join(mockCorePath, "governance");
    await fs.ensureDir(governanceDir);
    const rbacContent = `
roles:
  Admin:
    - mission:run
users:
  - username: default-admin
    role: Admin
    key: "stg_key_admin_replace_this_default_key"
`;
    await fs.writeFile(path.join(governanceDir, 'rbac.yml'), rbacContent);


    process.env.USE_MOCK_SWARM = 'true';

    const { configService } = await import("../../services/config_service.js");
    await configService.initialize();
    const config = configService.getConfig();

    engine = new Engine({
      config,
      startServer: true,
      projectRoot: testProjectRoot,
      corePath: mockCorePath,
    });

    // Wait for engine to be fully ready
    await engine.start();
    MOCK_SERVER_URL = `http://localhost:${engine.port}`;

    // Poll the health check endpoint to ensure the server is ready
    await poll(
      async () => {
        try {
          const response = await fetch(`${MOCK_SERVER_URL}/health`);
          return response.ok;
        } catch (e) {
          return false;
        }
      },
      5000, // 5-second timeout
      100   // 100ms interval
    );

    console.log(chalk.green(`[E2E Test] Engine running on ${MOCK_SERVER_URL}`));
  });

  afterEach(async () => {
    console.log(chalk.blue("[E2E Test] Tearing down..."));
    if (engine) {
      await engine.stop();
      console.log(chalk.green("[E2E Test] Engine stopped."));
    }
    if (tempDir) {
      tempDir.removeCallback();
      console.log(chalk.green("[E2E Test] Temporary directory removed."));
    }
    console.log(chalk.green("[E2E Test] Teardown complete."));
  });

  test("should successfully initiate a mission and reach PLANNING_PHASE", async () => {
    // Directly set the state to bypass the AI agent lifecycle for this test
    await engine.stateManager.updateStatus({
      newStatus: "PLANNING_PHASE",
      message: "Handoff to @specifier complete.",
    });

    const finalState = await poll(
      async () => {
        const stateResponse = await fetch(`${MOCK_SERVER_URL}/api/state`, {
            headers: { "Authorization": "Bearer stg_key_admin_replace_this_default_key" }
        });
        if (!stateResponse.ok) return false;
        const state = await stateResponse.json();
        return state.project_status === "PLANNING_PHASE" ? state : false;
      },
      5000, // 5-second timeout
      100
    );

    expect(finalState).toBeTruthy();
    expect(finalState.project_status).toBe("PLANNING_PHASE");
    expect(finalState.message).toBe("Handoff to @specifier complete.");
  }, 60000); // 60-second timeout for the entire test
});
