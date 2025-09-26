import { SystemValidator } from '../../src/bootstrap/system_validator.js';
import * as neo4j from 'neo4j-driver';

// This test requires a running Neo4j instance.
// It will be skipped if the connection fails, to avoid breaking the CI pipeline.
describe('Real-World: Neo4j Integration', () => {
  let driver;

  beforeAll(async () => {
    try {
      driver = neo4j.driver(
        process.env.NEO4J_URI || 'bolt://localhost:7687',
        neo4j.auth.basic(process.env.NEO4J_USER || 'neo4j', process.env.NEO4J_PASSWORD)
      );
      await driver.verifyConnectivity();
    } catch (error) {
      driver = null; // Set driver to null if connection fails
      console.warn('⚠️ Could not connect to Neo4j. Skipping real-world Neo4j tests.', error.message);
    }
  });

  afterAll(async () => {
    if (driver) {
      await driver.close();
    }
  });

  // Conditionally run tests only if the driver is available
  const itif = (condition) => condition ? it : it.skip;

  itif(driver)('SystemValidator should successfully validate a real Neo4j connection', async () => {
    const validator = new SystemValidator();
    const result = await validator.validateNeo4j();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Neo4j connection verified');
  });

  itif(driver)('should handle basic data indexing and retrieval', async () => {
    const session = driver.session();
    try {
      // Create test data
      await session.run(
        'CREATE (a:TestNode {id: $id, value: $value}) RETURN a',
        { id: 'test1', value: 'Hello, World!' }
      );

      // Retrieve test data
      const result = await session.run(
        'MATCH (a:TestNode {id: $id}) RETURN a.value AS value',
        { id: 'test1' }
      );

      expect(result.records).toHaveLength(1);
      expect(result.records[0].get('value')).toBe('Hello, World!');
    } finally {
      // Clean up test data and close session
      await session.run('MATCH (a:TestNode {id: $id}) DETACH DELETE a', { id: 'test1' });
      await session.close();
    }
  });
});
