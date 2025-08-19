import neo4j from "neo4j-driver";
import "dotenv/config.js";
import fs from "fs-extra";
import path from "path";
import { glob } from "glob";
import * as babelParser from "@babel/parser";
import traverse from "@babel/traverse";
import config from "../stigmergy.config.js";
import chalk from "chalk";

export class CodeIntelligenceService {
  constructor() {
    this.driver = null;
    this.isMemoryMode = false;
  }

  initializeDriver() {
    const neo4jFeature = config.features?.neo4j;
    if (neo4jFeature === "memory") {
      console.log(chalk.yellow("[CodeIntelligence] Configured for 'memory' mode."));
      this.isMemoryMode = true;
      return;
    }
    try {
      this.driver = neo4j.driver(
        process.env.NEO4J_URI,
        neo4j.auth.basic(process.env.NEO4J_USER, process.env.NEO4J_PASSWORD)
      );
    } catch (error) {
      console.error("[CodeIntelligence] Failed to initialize Neo4j driver.", error);
    }
  }

  async testConnection() {
    if (this.isMemoryMode) {
      return { success: true, type: "memory", warning: "Running in memory mode." };
    }
    if (!this.driver) this.initializeDriver();
    try {
      await this.driver.verifyConnectivity();
      return { success: true, type: "connected" };
    } catch (error) {
      if (config.features.neo4j === "auto") {
        console.warn(
          chalk.yellow("[CodeIntelligence] Neo4j connection failed. Falling back to 'memory' mode.")
        );
        this.isMemoryMode = true;
        return { success: true, type: "memory", warning: "Fell back to memory mode." };
      }
      return { success: false, error: error.message, type: "connection_failed" };
    }
  }

  async _runQuery(query, params) {
    if (this.isMemoryMode) return [];
    const session = this.driver.session();
    try {
      const result = await session.run(query, params);
      return result.records.map((r) => r.toObject());
    } finally {
      await session.close();
    }
  }

  // All public methods need the memory mode check
  async findUsages({ symbolName }) {
    if (this.isMemoryMode) return [];
    // ... existing logic
  }
  async getDefinition({ symbolName }) {
    if (this.isMemoryMode) return null;
    // ... existing logic
  }
  async calculateCKMetrics({ className }) {
    if (this.isMemoryMode) return {};
    // ... existing logic
  }
}
