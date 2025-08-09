import neo4j from "neo4j-driver";

export class Neo4jValidator {
  static async validate() {
    console.log("Checking Neo4j connection...");

    try {
      const driver = neo4j.driver(
        process.env.NEO4J_URI || "bolt://localhost:7687",
        neo4j.auth.basic(process.env.NEO4J_USER || "neo4j", process.env.NEO4J_PASSWORD)
      );

      const session = driver.session();
      await session.run("RETURN 1 AS test");
      await session.close();
      await driver.close();

      console.log(" -> Neo4j connection verified");
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          `Neo4j connection failed: ${error.message}. ` +
          `Ensure Neo4j is running and credentials are correct in .env`,
      };
    }
  }
}
