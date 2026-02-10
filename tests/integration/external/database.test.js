import { test, expect, describe, beforeEach } from "bun:test";
import neo4j from "neo4j-driver";
import { GraphStateManager } from "../../../engine/infrastructure/state/GraphStateManager.js";

const LIVE_TEST_TIMEOUT = 30000;

describe("External Service Health Check: Neo4j Database", () => {
  // RESTORED VARIABLES
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;

  const isLiveTestEnvironment = uri && user && password;

  test.if(isLiveTestEnvironment)(
    "LIVE: should connect to the configured Neo4j database successfully",
    async () => {
      let driver;
      let stateManager;
      try {
        driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
          connectionTimeout: 5000,
        });
        await driver.verifyConnectivity();
        console.log(`\n[Live Health Check] Successfully connected to Neo4j database.`);
        stateManager = new GraphStateManager("/mock/project", driver);
        await stateManager.initialize();
        const connectionResult = await stateManager.testConnection();
        expect(connectionResult.status).toBe("ok");
      } catch (error) {
        throw new Error(`Failed to connect to Neo4j at ${uri}. Details: ${error.message}`);
      } finally {
        if (stateManager) await stateManager.closeDriver();
        if (driver) await driver.close();
      }
    },
    LIVE_TEST_TIMEOUT
  );
});
