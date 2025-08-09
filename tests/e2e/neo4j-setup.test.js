import { jest } from "@jest/globals";
import { testNeo4j } from "../../scripts/test-neo4j.js";
import codeIntelligenceService from "../../services/code_intelligence_service.js";

// Mock the entire Neo4j service
jest.mock("../../services/code_intelligence_service", () => {
  const actual = jest.requireActual("../../services/code_intelligence_service");
  return {
    ...actual,
    testConnection: jest.fn().mockImplementation(() => ({
      success: true,
      type: "connected",
      limitations: {},
    })),
  };
});

describe("Neo4j Setup Test", () => {
  beforeAll(() => {
    process.env.NEO4J_URI = "bolt://localhost:7687";
    process.env.NEO4J_USER = "test-user";
    process.env.NEO4J_PASSWORD = "test-pass";
  });

  test("should verify Neo4j connection", async () => {
    const result = await testNeo4j();
    expect(result).toEqual({ success: true });
    expect(codeIntelligenceService.testConnection).toHaveBeenCalled();
  });
});
