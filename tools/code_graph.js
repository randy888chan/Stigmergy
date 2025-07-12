const neo4j = require('neo4j-driver');
require('dotenv').config();

let driver;

function getDriver() {
  if (!driver) {
    driver = neo4j.driver(
      process.env.NEO4J_URI,
      neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
    );
  }
  return driver;
}

// Example semantic search function for agents
async function findUsages({ symbolName }) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (caller)-[:CALLS]->(callee)
       WHERE callee.name = $symbolName OR callee.id CONTAINS $symbolName
       RETURN caller.id AS callerId, caller.name AS callerName`,
      { symbolName }
    );
    const usages = result.records.map(record => ({
      callerId: record.get('callerId'),
      callerName: record.get('callerName'),
    }));
    return `The symbol '${symbolName}' is used by: ${JSON.stringify(usages, null, 2)}`;
  } finally {
    await session.close();
  }
}

async function getModuleDependencies({ filePath }) {
  const session = getDriver().session();
  try {
    const result = await session.run(
      `MATCH (file:File {id: $filePath})-[:IMPORTS]->(dependency)
       RETURN dependency.id AS dependencyPath`,
      { filePath }
    );
    const dependencies = result.records.map(record => record.get('dependencyPath'));
    return `The file '${filePath}' imports: ${dependencies.join(', ')}`;
  } finally {
    await session.close();
  }
}

module.exports = {
  findUsages,
  getModuleDependencies,
};
