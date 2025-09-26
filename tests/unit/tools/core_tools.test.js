import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';

describe("Core Tools", () => {
  beforeEach(() => {
    mock.restore();
  });

  afterEach(() => {
    mock.restore();
  });

  describe("Guardian Tools", () => {
    test("backup should call coreBackup.autoBackup", async () => {
      // Mock dependencies
      const mockAutoBackup = mock().mockResolvedValue("/path/to/backup.tar.gz");
      const mockCoreBackup = { autoBackup: mockAutoBackup };
      
      // Import the function we're testing after mocking
      mock.module('../../../services/core_backup.js', () => {
        return {
          CoreBackup: mock().mockImplementation(() => mockCoreBackup)
        };
      });
      
      const { backup } = await import("../../../tools/core_tools.js");
      
      const result = await backup(mockCoreBackup);
      expect(mockAutoBackup).toHaveBeenCalled();
      expect(result).toContain("Core backup created successfully");
      
      // Clean up
      mock.restore();
    });

    test("backup should throw if coreBackup fails", async () => {
      // Mock dependencies
      const mockAutoBackup = mock().mockResolvedValue(null);
      const mockCoreBackup = { autoBackup: mockAutoBackup };
      
      // Import the function we're testing after mocking
      mock.module('../../../services/core_backup.js', () => {
        return {
          CoreBackup: mock().mockImplementation(() => mockCoreBackup)
        };
      });
      
      const { backup } = await import("../../../tools/core_tools.js");
      
      await expect(backup(mockCoreBackup)).rejects.toThrow("Core backup failed.");
      
      // Clean up
      mock.restore();
    });

    test("validate should call validateAgents and return success", async () => {
      // Mock dependencies
      const mockValidateAgents = mock().mockResolvedValue({ success: true });
      mock.module("../../../cli/commands/validate.js", () => ({
        validateAgents: mockValidateAgents,
      }));
      
      const { validate } = await import("../../../tools/core_tools.js");
      
      const result = await validate();
      expect(mockValidateAgents).toHaveBeenCalled();
      expect(result).toBe("Core agent validation passed successfully.");
      
      // Clean up
      mock.restore();
    });

    test("validate should throw if validation fails", async () => {
      // Mock dependencies
      const mockValidateAgents = mock().mockResolvedValue({ success: false, error: "Invalid agent" });
      mock.module("../../../cli/commands/validate.js", () => ({
        validateAgents: mockValidateAgents,
      }));
      
      const { validate } = await import("../../../tools/core_tools.js");
      
      await expect(validate()).rejects.toThrow("Core validation failed: Invalid agent");
      
      // Clean up
      mock.restore();
    });

    test("applyPatch should write to a file within .stigmergy-core", async () => {
      // Mock dependencies
      const mockWriteFile = mock();
      mock.module('fs-extra', () => ({
        default: {
          writeFile: mockWriteFile
        },
        writeFile: mockWriteFile
      }));
      
      const { applyPatch } = await import("../../../tools/core_tools.js");
      
      const filePath = "agents/test.md";
      const content = "new content";
      await applyPatch({ filePath, content });
      
      // Check that writeFile was called
      expect(mockWriteFile).toHaveBeenCalled();
      
      // Clean up
      mock.restore();
    });

    test("applyPatch should throw on path traversal", async () => {
      // Mock dependencies
      mock.module('fs-extra', () => ({ 
        default: {
          writeFile: mock()
        },
        writeFile: mock()
      }));
      
      const { applyPatch } = await import("../../../tools/core_tools.js");
      
      const filePath = "../outside.txt";
      const content = "hacker content";
      await expect(applyPatch({ filePath, content })).rejects.toThrow("Security violation");
      
      // Clean up
      mock.restore();
    });

    test("restore should call coreBackup.restoreLatest", async () => {
      // Mock dependencies
      const mockRestoreLatest = mock().mockResolvedValue(true);
      const mockCoreBackup = { restoreLatest: mockRestoreLatest };
      
      const { restore } = await import("../../../tools/core_tools.js");
      
      const result = await restore(mockCoreBackup);
      expect(mockRestoreLatest).toHaveBeenCalled();
      expect(result).toBe("Core restored successfully from latest backup.");
      
      // Clean up
      mock.restore();
    });

    test("restore should throw if restore fails", async () => {
      // Mock dependencies
      const mockRestoreLatest = mock().mockResolvedValue(false);
      const mockCoreBackup = { restoreLatest: mockRestoreLatest };
      
      const { restore } = await import("../../../tools/core_tools.js");
      
      await expect(restore(mockCoreBackup)).rejects.toThrow("Core restore failed.");
      
      // Clean up
      mock.restore();
    });
  });

  describe("System Control Tools", () => {
    test("start_project should initialize and start the engine", async () => {
      // Mock dependencies
      const mockInitializeProject = mock();
      const mockStart = mock();
      const mockEngine = {
        stateManager: {
          initializeProject: mockInitializeProject,
        },
        start: mockStart,
      };
      
      const { createSystemControlTools } = await import("../../../tools/core_tools.js");
      const systemTools = createSystemControlTools(mockEngine);
      
      const goal = "Test project";
      const result = await systemTools.start_project({ goal });
      expect(mockInitializeProject).toHaveBeenCalledWith(goal);
      expect(mockStart).toHaveBeenCalled();
      expect(result).toContain("Project initialized");
      
      // Clean up
      mock.restore();
    });

    test("pause_engine should stop the engine", async () => {
      // Mock dependencies
      const mockStop = mock();
      const mockEngine = {
        stop: mockStop,
      };
      
      const { createSystemControlTools } = await import("../../../tools/core_tools.js");
      const systemTools = createSystemControlTools(mockEngine);
      
      const result = await systemTools.pause_engine();
      expect(mockStop).toHaveBeenCalledWith("Paused by user command.");
      expect(result).toContain("engine loop has been paused");
      
      // Clean up
      mock.restore();
    });

    test("resume_engine should start the engine", async () => {
      // Mock dependencies
      const mockStart = mock();
      const mockEngine = {
        start: mockStart,
      };
      
      const { createSystemControlTools } = await import("../../../tools/core_tools.js");
      const systemTools = createSystemControlTools(mockEngine);
      
      const result = await systemTools.resume_engine();
      expect(mockStart).toHaveBeenCalled();
      expect(result).toContain("engine loop is resuming");
      
      // Clean up
      mock.restore();
    });

    test("get_status should retrieve the current status", async () => {
      // Mock dependencies
      const mockGetState = mock().mockResolvedValue({ project_status: "TESTING" });
      const mockEngine = {
        stateManager: {
          getState: mockGetState,
        },
      };
      
      const { createSystemControlTools } = await import("../../../tools/core_tools.js");
      const systemTools = createSystemControlTools(mockEngine);
      
      const status = await systemTools.get_status();
      expect(mockGetState).toHaveBeenCalled();
      expect(status).toBe("Current project status: TESTING");
      
      // Clean up
      mock.restore();
    });
  });
});