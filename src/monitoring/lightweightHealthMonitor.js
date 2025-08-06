import fs from "fs-extra";
import path from "path";
import { EventEmitter } from "events";

export class LightweightHealthMonitor extends EventEmitter {
  constructor() {
    super();
    this.healthFile = path.join(process.cwd(), ".ai", "health", "agents.json");
    this.metricsFile = path.join(process.cwd(), ".ai", "health", "metrics.jsonl");
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.ensureDir(path.dirname(this.healthFile));
    await fs.ensureDir(path.dirname(this.metricsFile));
  }

  async recordHealth(agentId, status, metrics = {}) {
    const healthData = {
      agentId,
      status,
      metrics,
      timestamp: Date.now(),
    };

    await fs.appendFile(this.metricsFile, JSON.stringify(healthData) + "\n");

    // Update current health
    let currentHealth = {};
    try {
      currentHealth = await fs.readJson(this.healthFile);
    } catch {}

    currentHealth[agentId] = { ...healthData, lastSeen: Date.now() };
    await fs.writeJson(this.healthFile, currentHealth, { spaces: 2 });
  }

  async checkAgentHealth(agentId) {
    try {
      const health = await fs.readJson(this.healthFile);
      const agentHealth = health[agentId];

      if (!agentHealth) return { healthy: false, reason: "No health data" };

      const timeSinceLastUpdate = Date.now() - agentHealth.lastSeen;

      if (timeSinceLastUpdate > 30000) {
        // 30 seconds
        return { healthy: false, reason: "Agent timeout" };
      }

      return { healthy: agentHealth.status === "healthy" };
    } catch {
      return { healthy: false, reason: "Health file missing" };
    }
  }

  async getHealthSummary() {
    try {
      const health = await fs.readJson(this.healthFile);
      return {
        totalAgents: Object.keys(health).length,
        healthyAgents: Object.values(health).filter((h) => h.status === "healthy").length,
        agents: health,
      };
    } catch {
      return { totalAgents: 0, healthyAgents: 0, agents: {} };
    }
  }

  async handleTaskFailure(task, agentId, error) {
    await this.recordHealth(agentId, "unhealthy", { task, error: error.message });
    // In a real system, we might reallocate the task here.
    // For now, we'll just return a recovery plan.
    return {
      newAgent: "fallback_agent", // Or some other logic
      strategy: "reallocate",
    };
  }
}
