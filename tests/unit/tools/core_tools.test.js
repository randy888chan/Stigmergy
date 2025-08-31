import fs from "fs-extra";
import coreBackup from "../../../services/core_backup.js";
import { validateAgents } from "../../../cli/commands/validate.js";
import {
  backup,
  validate,
  applyPatch,
  restore,
  createSystemControlTools,
} from "../../../tools/core_tools.js";

// Mock dependencies
jest.mock("fs-extra");
jest.mock("../../../services/core_backup.js", () => ({
  autoBackup: jest.fn(),
  restoreLatest: jest.fn(),
}));
jest.mock("../../../cli/commands/validate.js", () => ({
  validateAgents: jest.fn(),
}));

describe("Core Tools", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Guardian Tools", () => {
    test("backup should call coreBackup.autoBackup", async () => {
      coreBackup.autoBackup.mockResolvedValue("/path/to/backup.tar.gz");
      const result = await backup();
      expect(coreBackup.autoBackup).toHaveBeenCalled();
      expect(result).toContain("Core backup created successfully");
    });

    test("backup should throw if coreBackup fails", async () => {
        coreBackup.autoBackup.mockResolvedValue(null);
        await expect(backup()).rejects.toThrow("Core backup failed.");
    });

    test("validate should call validateAgents and return success", async () => {
      validateAgents.mockResolvedValue({ success: true });
      const result = await validate();
      expect(validateAgents).toHaveBeenCalled();
      expect(result).toBe("Core agent validation passed successfully.");
    });

    test("validate should throw if validation fails", async () => {
        validateAgents.mockResolvedValue({ success: false, error: "Invalid agent" });
        await expect(validate()).rejects.toThrow("Core validation failed: Invalid agent");
    });

    test("applyPatch should write to a file within .stigmergy-core", async () => {
      const filePath = "agents/test.md";
      const content = "new content";
      await applyPatch({ filePath, content });
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining(filePath),
        content
      );
    });

    test("applyPatch should throw on path traversal", async () => {
        const filePath = "../outside.txt";
        const content = "hacker content";
        await expect(applyPatch({ filePath, content })).rejects.toThrow("Security violation");
    });

    test("restore should call coreBackup.restoreLatest", async () => {
        coreBackup.restoreLatest.mockResolvedValue(true);
        const result = await restore();
        expect(coreBackup.restoreLatest).toHaveBeenCalled();
        expect(result).toBe("Core restored successfully from latest backup.");
    });

    test("restore should throw if restore fails", async () => {
        coreBackup.restoreLatest.mockResolvedValue(false);
        await expect(restore()).rejects.toThrow("Core restore failed.");
    });
  });

  describe("System Control Tools", () => {
    let systemTools;
    let mockEngine;

    beforeEach(() => {
      mockEngine = {
        stateManager: {
          initializeProject: jest.fn(),
          getState: jest.fn(),
        },
        start: jest.fn(),
        stop: jest.fn(),
      };
      systemTools = createSystemControlTools(mockEngine);
    });

    test("start_project should initialize and start the engine", async () => {
      const goal = "Test project";
      const result = await systemTools.start_project({ goal });
      expect(mockEngine.stateManager.initializeProject).toHaveBeenCalledWith(goal);
      expect(mockEngine.start).toHaveBeenCalled();
      expect(result).toContain("Project initialized");
    });

    test("pause_engine should stop the engine", async () => {
      const result = await systemTools.pause_engine();
      expect(mockEngine.stop).toHaveBeenCalledWith("Paused by user command.");
      expect(result).toContain("engine loop has been paused");
    });

    test("resume_engine should start the engine", async () => {
        const result = await systemTools.resume_engine();
        expect(mockEngine.start).toHaveBeenCalled();
        expect(result).toContain("engine loop is resuming");
    });

    test("get_status should retrieve the current status", async () => {
        mockEngine.stateManager.getState.mockResolvedValue({ project_status: "TESTING" });
        const status = await systemTools.get_status();
        expect(mockEngine.stateManager.getState).toHaveBeenCalled();
        expect(status).toBe("Current project status: TESTING");
    });
  });
});
