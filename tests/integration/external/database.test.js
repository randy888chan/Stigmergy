import { test, expect, describe } from 'bun:test';
import neo4j from 'neo4j-driver';

const LIVE_TEST_TIMEOUT = 30000;

describe('External Service Health Check: Neo4j Database', () => {
  const uri = process.env.NEO4J_URI;
  const user = process.env.NEO4J_USER;
  const password = process.env.NEO4J_PASSWORD;
  const credentialsArePresent = uri && user && password;

  test.if(credentialsArePresent)('LIVE: should connect to the configured Neo4j database successfully', async () => {
    let driver;
    try {
      driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        connectionTimeout: 5000, // 5-second timeout
      });
      await driver.verifyConnectivity();
      console.log(`\n[Live Health Check] Successfully connected to Neo4j database.`);
      expect(true).toBe(true); // If we reach here, the connection is a success
    } catch (error) {
      // This will now properly fail the test if connection fails with credentials
      throw new Error(`Failed to connect to Neo4j at ${uri}. Please ensure the database is running and credentials are correct. Details: ${error.message}`);
    } finally {
      if (driver) {
        await driver.close();
      }
    }
  }, LIVE_TEST_TIMEOUT);

  test.if(!credentialsArePresent)('SKIPPED: Neo4j credentials not found', () => {
    console.log("\n[Health Check] SKIPPED: NEO4J_URI, NEO4J_USER, or NEO4J_PASSWORD not set. Skipping live DB test.");
    expect(true).toBe(true); // Always pass if skipped
  });
});
