// ... imports ...
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
      this.isMemoryMode = true;
      return;
    }
    // ... rest of logic
  }
  async testConnection() {
    if (this.isMemoryMode) return { success: true, type: "memory" };
    try {
      await this.driver.verifyConnectivity();
      return { success: true, type: "connected" };
    } catch (error) {
      if (config.features.neo4j === "auto") {
        this.isMemoryMode = true;
        return { success: true, type: "memory", warning: "Fell back to memory mode." };
      }
      return { success: false, error: error.message };
    }
  }
  async findUsages({ symbolName }) {
    if (this.isMemoryMode) return [];
    // ...
  }
  // ... repeat for all public query methods
}
