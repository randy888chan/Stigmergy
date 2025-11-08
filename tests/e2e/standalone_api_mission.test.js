import { Engine } from "../../engine/server.js";
import { configService } from "../../services/config_service.js";
import tmp from "tmp";
import fs from "fs-extra";
import path from "path";
import assert from "assert";
import chalk from "chalk";

const UNIQUE_TEST_PORT = '3099';
const MOCK_SERVER_URL = `http://localhost:${UNIQUE_TEST_PORT}`;

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

async function main() {
  let engine;
  let tempDir;

  try {
    console.log(chalk.blue("[Standalone E2E] Setting up test environment..."));
    tempDir = tmp.dirSync({ unsafeCleanup: true });
    const testProjectRoot = tempDir.name;

    const mockCorePath = path.join(testProjectRoot, ".stigmergy-core");
    const mockAgentsPath = path.join(mockCorePath, "agents");
    await fs.ensureDir(mockAgentsPath);
    await fs.copy(path.join(process.cwd(), ".stigmergy-core", "agents"), mockAgentsPath);

    process.env.STIGMERGY_PORT = UNIQUE_TEST_PORT;
    process.env.USE_MOCK_SWARM = 'true';
    process.env.OPENROUTER_API_KEY = 'mock-key';
    process.env.OPENROUTER_BASE_URL = 'http://localhost/mock';

    await configService.initialize();
    const config = configService.getConfig();

    engine = new Engine({
      config,
      startServer: true,
      projectRoot: testProjectRoot,
      corePath: mockCorePath,
    });

    await engine.stateManagerInitializationPromise;
    await engine.toolExecutorPromise;
    await engine.start();
    console.log(chalk.green("[Standalone E2E] Test environment setup complete."));

    console.log(chalk.blue("[Standalone E2E] Running test..."));
    const mission = {
      missionTitle: "E2E Test Mission",
      userStories: "- As a user, I want this test to pass.",
      acceptanceCriteria: "- The system state becomes PLANNING_PHASE.",
    };

    const response = await fetch(`${MOCK_SERVER_URL}/api/mission/briefing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer stg_key_admin_replace_this_default_key"
      },
      body: JSON.stringify(mission),
    });

    assert.strictEqual(response.status, 200, "Response status should be 200");
    const body = await response.json();
    assert.strictEqual(body.message, "Mission briefing received and initiated successfully.", "Response message is incorrect");

    const finalState = await poll(
      async () => {
        const stateResponse = await fetch(`${MOCK_SERVER_URL}/api/state`, {
          headers: {
            "Authorization": "Bearer stg_key_admin_replace_this_default_key"
          }
        });
        if (!stateResponse.ok) return false;
        const state = await stateResponse.json();
        return state.project_status === "PLANNING_PHASE" ? state : false;
      },
      10000,
      500
    );

    assert.ok(finalState, "Final state should not be null");
    assert.strictEqual(finalState.project_status, "PLANNING_PHASE", "Final project status should be PLANNING_PHASE");
    assert.strictEqual(finalState.message, "Handoff to @specifier complete.", "Final state message is incorrect");

    console.log(chalk.green("[Standalone E2E] Test PASSED!"));
  } catch (error) {
    console.error(chalk.red("[Standalone E2E] Test FAILED:"), error);
    process.exit(1);
  } finally {
    console.log(chalk.blue("[Standalone E2E] Tearing down test environment..."));
    if (engine) {
      await engine.stop();
      console.log(chalk.green("[Standalone E2E] Engine stopped."));
    }
    if (tempDir) {
      tempDir.removeCallback();
      console.log(chalk.green("[Standalone E2E] Temporary directory removed."));
    }
    console.log(chalk.green("[Standalone E2E] Teardown complete."));
    process.exit(0);
  }
}

main();
