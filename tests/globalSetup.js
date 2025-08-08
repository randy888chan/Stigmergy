module.exports = async () => {
  // Fix global environment issues
  process.env.NEO4J_URI = "bolt://localhost:7687";
  process.env.NEO4J_USER = "test";
  process.env.NEO4J_PASSWORD = "test";
};
