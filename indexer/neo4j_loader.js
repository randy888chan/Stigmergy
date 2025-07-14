const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver;

function getDriver() {
    if (!driver) {
        if (!process.env.NEO4J_URI || !process.env.NEO4J_USER || !process.env.NEO4J_PASSWORD) {
            throw new Error("Neo4j credentials are not set in the .env file.");
        }
        driver = neo4j.driver(
            process.env.NEO4J_URI,
            neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
        );
    }
    return driver;
}

async function init() {
  const session = getDriver().session();
  try {
    await session.run('CREATE CONSTRAINT file_id IF NOT EXISTS FOR (n:File) REQUIRE n.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT function_id IF NOT EXISTS FOR (n:Function) REQUIRE n.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT class_id IF NOT EXISTS FOR (n:Class) REQUIRE n.id IS UNIQUE');
    console.log("Neo4j constraints ensured.");
  } catch (error) {
      console.error("Error initializing Neo4j constraints. Is the database running?", error);
      throw error;
  }
  finally {
    await session.close();
  }
}

async function clearDatabase() {
  const session = getDriver().session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
  } finally {
    await session.close();
  }
}

async function loadData({ nodes, relationships }) {
  const session = getDriver().session();
  try {
    // Use MERGE to avoid creating duplicate nodes
    await session.run(
      `UNWIND $nodes AS node_data
       MERGE (n {id: node_data.id})
       SET n += node_data, n:Symbol`,
      { nodes }
    );
    console.log(`Loaded/merged ${nodes.length} nodes.`);

    // Note: The APOC relationship creation is powerful but may not be available on all Neo4j installs.
    // A standard MERGE is safer for broader compatibility.
    await session.run(
      `UNWIND $relationships AS rel_data
       MATCH (source {id: rel_data.source})
       MATCH (target {id: rel_data.target})
       MERGE (source)-[r:${rel_data.type}]->(target)
       RETURN count(r)`,
       { relationships }
    );
    console.log(`Loaded/merged ${relationships.length} relationships.`);
  } finally {
    await session.close();
  }
}

async function close() {
    if (driver) {
        await driver.close();
        driver = null;
    }
}

module.exports = { init, clearDatabase, loadData, close };
