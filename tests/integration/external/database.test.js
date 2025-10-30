import { test, expect, describe } from "bun:test";
import neo4j from "neo4j-driver";
import { GraphStateManager } from "../../../src/infrastructure/state/GraphStateManager.js";

const LIVE_TEST_TIMEOUT = 30000;

describe("External Service Health Check: Neo4j Database", () => {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  // --- DEFINITIVE FIX: Use the standard 'CI' environment variable to skip live tests ---
  // This is a more robust and conventional way to prevent live service tests
  // from running in automated environments.
  const isLiveTestEnvironment = uri && user && password && !process.env.CI;

  test.if(isLiveTestEnvironment)(
    "LIVE: should connect to the configured Neo4j database successfully",
    async () => {
      let driver;
      let stateManager;
      try {
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
          connectionTimeout: 5000, // 5-second timeout
        });
        await driver.verifyConnectivity();
        console.log(`\n[Live Health Check] Successfully connected to Neo4j database.`);
        stateManager = new GraphStateManager();
        await stateManager.testConnection();
        expect(true).toBe(true); // If we reach here, the connection is a success
      } catch (error) {
        // This will now properly fail the test if connection fails with credentials
        throw new Error(
          `Failed to connect to Neo4j at ${uri}. Please ensure the database is running and credentials are correct. Details: ${error.message}`
        );
      } finally {
        if (driver) {
          await driver.close();
        }
        if (stateManager) {
          await stateManager.closeDriver();
        }
      }
    },
    LIVE_TEST_TIMEOUT
  );
});
