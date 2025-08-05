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
