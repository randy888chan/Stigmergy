import config from "../stigmergy.config.js";

export const testNeo4j = async () => {
  const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = process.env;
  const neo4jRequired = config.features.neo4j === 'required';

  if (neo4jRequired && (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD)) {
    return {
      success: false,
      error: "Neo4j credentials are not set, but are required.",
    };
  }

  if (config.features.neo4j === 'auto' && (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD)) {
    return {
      success: true,
      message: "Neo4j credentials not found, falling back to Memory Mode.",
    };
  }

  return {
    success: true,
    message: "Neo4j is configured.",
  };
};
