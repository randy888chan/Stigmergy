import { jest, describe, test, expect, beforeEach, afterAll } from "@jest/globals";
import * as stateManager from "../engine/state_manager.js";
import * as llm_adapter from "../engine/llm_adapter.js";
import { Engine } from "../engine/server.js";

jest.spyOn(console, "log").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

describe("Autonomous Engine Integration Test", () => {
  let engine;
  beforeEach(() => {
    jest.clearAllMocks();
    engine = new Engine();
    engine.stop("Test Setup");

    jest
      .spyOn(stateManager, "getState")
      .mockResolvedValueOnce({ project_status: "GRAND_BLUEPRINT_PHASE", artifacts_created: {} })
      .mockResolvedValueOnce({
        project_status: "GRAND_BLUEPRINT_PHASE",
        artifacts_created: { brief: true },
      })
      .mockResolvedValueOnce({
        project_status: "GRAND_BLUEPRINT_PHASE",
        artifacts_created: { brief: true, prd: true },
      });
    jest.spyOn(llm_adapter, "getCompletion").mockResolvedValue({ action: {} });
    jest.spyOn(stateManager, "updateStatus").mockResolvedValue();
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });

  test("should autonomously run the Grand Blueprint Phase", async () => {
    await engine.runLoop();
    await engine.runLoop();
    await engine.runLoop();

    expect(llm_adapter.getCompletion).toHaveBeenCalledTimes(3);
    expect(stateManager.updateStatus).toHaveBeenCalledWith(
      "AWAITING_EXECUTION_APPROVAL",
      expect.any(String)
    );
  }, 20000);
});
