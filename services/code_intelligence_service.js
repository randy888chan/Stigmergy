import neo4j from "neo4j-driver";
import { setTimeout } from "timers/promises";
import "dotenv/config.js";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";

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
    } else {
      console.warn("[CodeIntelligence] Neo4j credentials not set. Service is disabled.");
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
        console.warn(`[Neo4j] Connection attempt ${attempt} failed. Retrying in ${delay}ms...`);
        await setTimeout(delay);
      }
    }
  }

  async _runQuery(query, params) {
    if (!this.driver) this.initializeDriver();
    if (!this.driver) throw new Error("Neo4j driver not initialized or credentials not set.");

    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((record) => record.toObject());
    } finally {
      await session.close();
    }
  }

  async _clearDatabase() {
    await this._runQuery("MATCH (n) DETACH DELETE n");
  }

  async _findSourceFiles(projectPath) {
    return glob("**/*.{js,jsx,ts,tsx}", {
      cwd: projectPath,
      ignore: ["node_modules/**", "dist/**", "build/**", ".*/**"],
      absolute: true,
    });
  }

  async _parseFile(filePath, projectRoot) {
    // ... existing implementation ...
  }

  async _loadDataIntoGraph({ nodes, relationships }) {
    // ... existing implementation ...
  }

  async scanAndIndexProject(projectPath) {
    // ... existing implementation ...
  }

  async findUsages({ symbolName }) {
    // ... existing implementation ...
  }

  async getDefinition({ symbolName }) {
    // ... existing implementation ...
  }

  async getModuleDependencies({ filePath }) {
    // ... existing implementation ...
  }

  async calculateCKMetrics({ className }) {
    // ... existing implementation ...
  }
}

export default new CodeIntelligenceService();
