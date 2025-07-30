import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import codeIntelligenceService from "../../services/code_intelligence_service.js";
import neo4j from "neo4j-driver";
import fs from "fs-extra";
import { glob } from "glob";

// Mock the external dependencies
jest.mock("neo4j-driver");
jest.mock("fs-extra");
jest.mock("glob");

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
      neo4j.auth.basic("neo4j", "password")
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

  it("should clear the database", async () => {
    await codeIntelligenceService._clearDatabase();
    expect(mockSession.run).toHaveBeenCalledWith("MATCH (n) DETACH DELETE n", undefined);
  });

  describe("scanAndIndexProject", () => {
    it("should find files, parse them, and load data into the graph", async () => {
      // Mock file system and glob results
      glob.mockResolvedValue(["/project/src/index.js"]);
      fs.readFile.mockResolvedValue(`
            import { other } from './other.js';
            function hello() { console.log('world'); }
        `);

      // Spy on the internal methods to verify they are called
      const clearDbSpy = jest
        .spyOn(codeIntelligenceService, "_clearDatabase")
        .mockResolvedValue(undefined);
      const parseFileSpy = jest
        .spyOn(codeIntelligenceService, "_parseFile")
        .mockResolvedValue({ nodes: [{ id: "a" }], relationships: [{ id: "b" }] });
      const loadDataSpy = jest
        .spyOn(codeIntelligenceService, "_loadDataIntoGraph")
        .mockResolvedValue(undefined);

      await codeIntelligenceService.scanAndIndexProject("/project");

      expect(clearDbSpy).toHaveBeenCalled();
      expect(glob).toHaveBeenCalledWith("**/*.{js,jsx,ts,tsx}", expect.any(Object));
      expect(parseFileSpy).toHaveBeenCalledWith("/project/src/index.js", "/project");
      expect(loadDataSpy).toHaveBeenCalledWith({
        nodes: [{ id: "a" }],
        relationships: [{ id: "b" }],
      });

      // Restore the original implementations to prevent mock leaking
      clearDbSpy.mockRestore();
      parseFileSpy.mockRestore();
      loadDataSpy.mockRestore();
    });
  });

  describe("_parseFile", () => {
    it("should correctly parse AST for nodes and relationships", async () => {
      const filePath = "/project/src/app.js";
      const projectRoot = "/project";
      const code = `
            import { helper } from './utils/helper.js';

            class MyClass extends BaseClass {
                constructor() {}

                myMethod() {
                    helper();
                }
            }

            function topLevelFunc() {}
        `;
      fs.readFile.mockResolvedValue(code);

      const { nodes, relationships } = await codeIntelligenceService._parseFile(
        filePath,
        projectRoot
      );

      // Check for File node
      expect(nodes).toContainEqual(expect.objectContaining({ type: "File", path: "src/app.js" }));
      // Check for Class node
      expect(nodes).toContainEqual(expect.objectContaining({ type: "Class", name: "MyClass" }));
      // Check for Function node
      expect(nodes).toContainEqual(
        expect.objectContaining({ type: "Function", name: "topLevelFunc" })
      );

      // Check for IMPORTS relationship
      expect(relationships).toContainEqual({
        source: "src/app.js",
        target: "src/utils/helper.js",
        type: "IMPORTS",
      });
      // Check for DEFINES relationship
      expect(relationships).toContainEqual({
        source: "src/app.js",
        target: "src/app.js#MyClass",
        type: "DEFINES",
      });
      // Check for EXTENDS relationship
      expect(relationships).toContainEqual({
        source: "src/app.js#MyClass",
        targetName: "BaseClass",
        type: "EXTENDS",
      });
      // Check for CALLS relationship
      expect(relationships).toContainEqual({
        source: "src/app.js#myMethod",
        targetName: "helper",
        type: "CALLS",
      });
    });
  });
});
