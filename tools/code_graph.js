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

async function runQuery(query, params) {
    const session = getDriver().session();
    try {
        const result = await session.run(query, params);
        return result.records.map(record => record.toObject());
    } finally {
        await session.close();
    }
}

async function findUsages({ symbolName }) {
    const query = `
        MATCH (target {name: $symbolName})<-[r]-(source)
        RETURN source.id AS user, type(r) as relationship
    `;
    return await runQuery(query, { symbolName });
}

async function getDefinition({ symbolName }) {
    const query = `
        MATCH (n {name: $symbolName})
        RETURN n.id as id, n.type as type
    `;
    return await runQuery(query, { symbolName });
}

async function getModuleDependencies({ filePath }) {
    const query = `
        MATCH (f:File {id: $filePath})-[r:IMPORTS]->(dependency)
        RETURN dependency.id as dependency, dependency.type as type
    `;
    return await runQuery(query, { filePath });
}


module.exports = {
  findUsages,
  getDefinition,
  getModuleDependencies
};
