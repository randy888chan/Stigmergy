import neo4j from "neo4j-driver";
import { setTimeout } from "timers/promises";
import "dotenv/config";

class CodeIntelligenceService {
  constructor() {
    this.driver = null;
  }

  initializeDriver() {
    if (process.env.NEO4J_URI && process.env.NEO4J_USER && process.env.NEO4J_PASSWORD) {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD),
        { disableLosslessIntegers: true }
      );
    }
  }

  async testConnection(retries = 3, baseDelay = 1000) {
    if (!this.driver) this.initializeDriver();
    if (!this.driver) {
      return {
        success: false,
        error: "Neo4j driver not initialized. Check your .env credentials.",
      };
    }

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const session = this.driver.session();
        await session.run("RETURN 1");
        await session.close();
        return { success: true, message: "Connection successful" };
      } catch (error) {
        if (attempt === retries) {
          return {
            success: false,
            error: `Connection failed after ${retries} attempts: ${error.message}`,
          };
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await setTimeout(delay);
      }
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) this.initializeDriver();
    if (!this.driver) throw new Error("Neo4j driver not initialized");

    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  // ... rest of existing class methods ...
}

export default new CodeIntelligenceService();
