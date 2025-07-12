const neo4j = require('neo4j-driver');
require('dotenv').config();

const driver = neo4j.driver(
  process.env.NEO4J_URI,
  neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
);

async function init() {
  const session = driver.session();
  try {
    // Create constraints for faster lookups
    await session.run('CREATE CONSTRAINT IF NOT EXISTS ON (n:File) ASSERT n.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT IF NOT EXISTS ON (n:Function) ASSERT n.id IS UNIQUE');
    await session.run('CREATE CONSTRAINT IF NOT EXISTS ON (n:Class) ASSERT n.id IS UNIQUE');
  } finally {
    await session.close();
  }
}

async function clearDatabase() {
  const session = driver.session();
  try {
    await session.run('MATCH (n) DETACH DELETE n');
  } finally {
    await session.close();
  }
}

async function loadData({ nodes, relationships }) {
  const session = driver.session();
  try {
    // Load nodes in bulk
    await session.run(
      `UNWIND $nodes AS node_data
       MERGE (n {id: node_data.id})
       SET n += node_data, n:Symbol`,
      { nodes }
    );

    // Load relationships in bulk
    // This query is more complex as it needs to find the source and target nodes first.
    await session.run(
      `UNWIND $relationships AS rel_data
       MATCH (source {id: rel_data.source})
       MATCH (target {id: rel_data.target})
       CALL apoc.create.relationship(source, rel_data.type, {}, target) YIELD rel
       RETURN count(rel)`,
       { relationships }
    );
  } finally {
    await session.close();
  }
}

async function close() {
  await driver.close();
}

module.exports = { init, clearDatabase, loadData, close };
