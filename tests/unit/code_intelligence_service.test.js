import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import codeIntelligenceService from "../../services/code_intelligence_service.js";
import neo4j from "neo4j-driver";
import fs from "fs-extra";
import { glob } from "glob";
import chokidar from "chokidar";

// Mock the external dependencies
jest.mock("neo4j-driver");
jest.mock("fs-extra");
jest.mock("glob");
jest.mock("chokidar");

describe("Code Intelligence Service", () => {
  let mockSession;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup the mock for the neo4j driver
    mockSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const mockDriver = {
      session: jest.fn(() => mockSession),
      close: jest.fn().mockResolvedValue(undefined),
    };
    neo4j.driver.mockReturnValue(mockDriver);

    // Manually reset the internal driver in the service instance
    codeIntelligenceService.driver = null;
    process.env.NEO4J_URI = "bolt://localhost:7687";
    process.env.NEO4J_USER = "neo4j";
    process.env.NEO4J_PASSWORD = "password";
  });

  it("should initialize the driver if it's not already initialized", async () => {
    await codeIntelligenceService._runQuery("RETURN 1");
    expect(neo4j.driver).toHaveBeenCalledWith(
      "bolt://localhost:7687",
      neo4j.auth.basic("neo4j", "password"),
      { disableLosslessIntegers: true }
    );
    expect(mockSession.run).toHaveBeenCalledWith("RETURN 1", undefined);
  });

  it("should not re-initialize the driver if it already exists", async () => {
    // Initialize it once
    await codeIntelligenceService._runQuery("RETURN 1");
    expect(neo4j.driver).toHaveBeenCalledTimes(1);

    // Run another query
    await codeIntelligenceService._runQuery("RETURN 2");
    // Should not have been called again
    expect(neo4j.driver).toHaveBeenCalledTimes(1);
  });
});

describe("Neo4j Limitation Detection", () => {
  const mockSession = {
    run: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(() => {
    const mockDriver = {
      session: () => mockSession,
      close: jest.fn().mockResolvedValue(undefined),
    };
    neo4j.driver.mockReturnValue(mockDriver);
    codeIntelligenceService.driver = mockDriver;
    codeIntelligenceService.isMemory = false;
  });

  it("should detect Community Edition limitations", async () => {
    mockSession.run.mockResolvedValue({
      records: [
        {
          get: () => "community",
        },
      ],
    });

    const result = await codeIntelligenceService.detectNeo4jLimitations();
    expect(result.warning).toContain("Community Edition");
    expect(result.limitation).toContain("4GB");
  });

  it("should return no warnings for Enterprise Edition", async () => {
    mockSession.run.mockResolvedValue({
      records: [
        {
          get: () => "enterprise",
        },
      ],
    });

    const result = await codeIntelligenceService.detectNeo4jLimitations();
    expect(result.warning).toBeUndefined();
  });

  it("should handle detection failures", async () => {
    mockSession.run.mockRejectedValue(new Error("Connection failed"));
    const result = await codeIntelligenceService.detectNeo4jLimitations();
    expect(result.error).toContain("failed");
  });
});

describe("Incremental Indexing", () => {
  let mockSession;
  let mockWatcher;
  const projectPath = "/test/project";

  beforeEach(() => {
    jest.clearAllMocks();

    mockWatcher = {
      on: jest.fn().mockReturnThis(),
    };
    chokidar.watch.mockReturnValue(mockWatcher);

    // Reset the watcher on the service instance before each test
    codeIntelligenceService.watcher = null;

    const mockTransaction = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    };
    mockSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn().mockResolvedValue(undefined),
      beginTransaction: jest.fn().mockReturnValue(mockTransaction),
    };
    const mockDriver = {
      session: jest.fn(() => mockSession),
      close: jest.fn().mockResolvedValue(undefined),
    };
    neo4j.driver.mockReturnValue(mockDriver);
    codeIntelligenceService.driver = mockDriver;
    codeIntelligenceService.projectRoot = projectPath;

    fs.readFile.mockResolvedValue("const a = 1;");
    fs.stat.mockResolvedValue({
      mtime: {
        getTime: () => 1000,
      },
    });
  });

  it("should start watching files when incremental indexing is enabled", async () => {
    await codeIntelligenceService.enableIncrementalIndexing(projectPath);
    expect(chokidar.watch).toHaveBeenCalledWith(projectPath, expect.any(Object));
    expect(mockWatcher.on).toHaveBeenCalledWith("add", expect.any(Function));
    expect(mockWatcher.on).toHaveBeenCalledWith("change", expect.any(Function));
    expect(mockWatcher.on).toHaveBeenCalledWith("unlink", expect.any(Function));
  });

  it("should index a new file on 'add' event", async () => {
    await codeIntelligenceService.enableIncrementalIndexing(projectPath);
    const addCallback = mockWatcher.on.mock.calls.find((call) => call[0] === "add")[1];

    const filePath = "/test/project/newFile.js";
    await addCallback(filePath);

    expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf-8");
    expect(mockSession.beginTransaction).toHaveBeenCalled();
  });

  it("should update a file on 'change' event", async () => {
    await codeIntelligenceService.enableIncrementalIndexing(projectPath);
    const changeCallback = mockWatcher.on.mock.calls.find((call) => call[0] === "change")[1];
    const filePath = "/test/project/existingFile.js";

    await changeCallback(filePath);

    // It should first try to remove the file via _runQuery
    expect(mockSession.run).toHaveBeenCalledWith(expect.stringContaining("DETACH DELETE"), {
      id: "existingFile.js",
    });
    // Then it should index it again
    expect(fs.readFile).toHaveBeenCalledWith(filePath, "utf-8");
    expect(mockSession.beginTransaction).toHaveBeenCalled();
  });

  it("should remove a file on 'unlink' event", async () => {
    await codeIntelligenceService.enableIncrementalIndexing(projectPath);
    const unlinkCallback = mockWatcher.on.mock.calls.find((call) => call[0] === "unlink")[1];
    const filePath = "/test/project/deletedFile.js";

    await unlinkCallback(filePath);

    expect(mockSession.run).toHaveBeenCalledWith(expect.stringContaining("DETACH DELETE"), {
      id: "deletedFile.js",
    });
  });
});

describe("Project Scanning and Indexing", () => {
  const projectPath = "/test/project";
  let indexFileSpy, updateFileSpy, removeFileSpy;

  beforeEach(() => {
    // Spy on the methods that perform the actual work
    indexFileSpy = jest.spyOn(codeIntelligenceService, "indexFile").mockResolvedValue();
    updateFileSpy = jest.spyOn(codeIntelligenceService, "updateFile").mockResolvedValue();
    removeFileSpy = jest.spyOn(codeIntelligenceService, "removeFile").mockResolvedValue();

    // Mock fs.stat for consistent modification times
    fs.stat.mockImplementation(async (path) => ({
      mtime: {
        getTime: () => {
          if (path.includes("modified")) return 2000;
          return 1000;
        },
      },
    }));

    // Mock driver and session
    const mockSession = {
      run: jest.fn().mockResolvedValue({ records: [] }),
      close: jest.fn().mockResolvedValue(undefined),
    };
    const mockDriver = {
      session: jest.fn(() => mockSession),
      close: jest.fn().mockResolvedValue(undefined),
    };
    neo4j.driver.mockReturnValue(mockDriver);
    codeIntelligenceService.driver = mockDriver;
  });

  afterEach(() => {
    // Restore the original methods
    indexFileSpy.mockRestore();
    updateFileSpy.mockRestore();
    removeFileSpy.mockRestore();
    jest.restoreAllMocks();
  });

  it("should index new files", async () => {
    // Graph has one file, filesystem has two
    jest
      .spyOn(codeIntelligenceService, "_getGraphFiles")
      .mockResolvedValue(new Map([["existing.js", 1000]]));
    glob.glob.mockResolvedValue(["/test/project/existing.js", "/test/project/new.js"]);

    await codeIntelligenceService.scanAndIndexProject(projectPath);

    expect(indexFileSpy).toHaveBeenCalledWith("/test/project/new.js");
    expect(updateFileSpy).not.toHaveBeenCalled();
    expect(removeFileSpy).not.toHaveBeenCalled();
  });

  it("should update modified files", async () => {
    // Graph has an old version of the file
    jest
      .spyOn(codeIntelligenceService, "_getGraphFiles")
      .mockResolvedValue(new Map([["modified.js", 1000]]));
    glob.glob.mockResolvedValue(["/test/project/modified.js"]);

    await codeIntelligenceService.scanAndIndexProject(projectPath);

    expect(updateFileSpy).toHaveBeenCalledWith("/test/project/modified.js");
    expect(indexFileSpy).not.toHaveBeenCalled();
    expect(removeFileSpy).not.toHaveBeenCalled();
  });

  it("should remove deleted files", async () => {
    // Graph has a file that's no longer on the filesystem
    jest
      .spyOn(codeIntelligenceService, "_getGraphFiles")
      .mockResolvedValue(new Map([["deleted.js", 1000]]));
    glob.glob.mockResolvedValue([]);

    await codeIntelligenceService.scanAndIndexProject(projectPath);

    expect(removeFileSpy).toHaveBeenCalledWith("/test/project/deleted.js");
    expect(indexFileSpy).not.toHaveBeenCalled();
    expect(updateFileSpy).not.toHaveBeenCalled();
  });

  it("should handle a mix of new, modified, and deleted files", async () => {
    jest.spyOn(codeIntelligenceService, "_getGraphFiles").mockResolvedValue(
      new Map([
        ["existing.js", 1000],
        ["modified.js", 1000],
        ["deleted.js", 1000],
      ])
    );
    glob.glob.mockResolvedValue([
      "/test/project/existing.js",
      "/test/project/modified.js",
      "/test/project/new.js",
    ]);

    await codeIntelligenceService.scanAndIndexProject(projectPath);

    expect(indexFileSpy).toHaveBeenCalledWith("/test/project/new.js");
    expect(updateFileSpy).toHaveBeenCalledWith("/test/project/modified.js");
    expect(removeFileSpy).toHaveBeenCalledWith("/test/project/deleted.js");
  });

  it("should do nothing if project is up to date", async () => {
    jest
      .spyOn(codeIntelligenceService, "_getGraphFiles")
      .mockResolvedValue(new Map([["existing.js", 1000]]));
    glob.glob.mockResolvedValue(["/test/project/existing.js"]);

    await codeIntelligenceService.scanAndIndexProject(projectPath);

    expect(indexFileSpy).not.toHaveBeenCalled();
    expect(updateFileSpy).not.toHaveBeenCalled();
    expect(removeFileSpy).not.toHaveBeenCalled();
  });
});
