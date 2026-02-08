import neo4j from "neo4j-driver";
import "dotenv/config.js";
import chalk from "chalk";

/**
 * Creates and returns a Neo4j driver instance configured from environment variables.
 * This serves as the primary storage engine for the Knowledge Graph.
 */
export function createGraphStore() {
  const uri = process.env.NEO4J_URI || "bolt://localhost:7687";
  const user = process.env.NEO4J_USER || "neo4j";
  const password = process.env.NEO4J_PASSWORD || "password";

  console.log(chalk.blue(`[GraphStore] Connecting to Neo4j at ${uri}`));

  try {
    const driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
        maxConnectionPoolSize: 50,
        connectionTimeout: 10000, // 10 seconds
    });

    // Test the connection
    driver.verifyConnectivity()
        .then(() => console.log(chalk.green("[GraphStore] Successfully connected to Neo4j.")))
        .catch(err => console.error(chalk.red(`[GraphStore] Connection failed: ${err.message}`)));

    return driver;
  } catch (error) {
    console.error(chalk.red(`[GraphStore] Failed to create Neo4j driver: ${error.message}`));
    throw error;
  }
}

export default createGraphStore;
