import { testNeo4j } from "../../scripts/test-neo4j.js";
import config from "../../stigmergy.config.js";

describe("Neo4j Setup Test", () => {
  // Store the original config to restore it after the test
  const originalNeo4jFeature = config.features.neo4j;

  beforeEach(() => {
    // Unset credentials to simulate a CI environment
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USER;
    delete process.env.NEO4J_PASSWORD;
  });

  afterEach(() => {
    // Restore the original config
    config.features.neo4j = originalNeo4jFeature;
  });

  test("should fail when neo4j is required but no credentials are provided", async () => {
    // Ensure the config is 'required' for this test
    config.features.neo4j = 'required';
    const result = await testNeo4j();
    expect(result.success).toBe(false);
    expect(result.error).toContain("credentials are not set");
  });

  test("should gracefully fallback to memory mode when set to 'auto'", async () => {
    // Set config to 'auto' to test the fallback
    config.features.neo4j = 'auto';
    const result = await testNeo4j();
    expect(result.success).toBe(true);
    expect(result.message).toContain("falling back to Memory Mode");
  });
});
