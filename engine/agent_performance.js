/**
 * Agent Performance Tracking System
 * Measures and analyzes agent effectiveness for intelligent task routing
 */

import fs from "fs-extra";
import path from "path";

class AgentPerformance {
  constructor() {
    this.metricsPath = path.join(process.cwd(), ".ai", "agent_metrics");
    this.initialize();
  }

  async initialize() {
    await fs.ensureDir(this.metricsPath);

    // Create metrics index if it doesn't exist
    const indexPath = path.join(this.metricsPath, "index.json");
    if (!(await fs.pathExists(indexPath))) {
      await fs.writeJson(indexPath, {
        version: "1.0",
        agents: {},
        taskTypes: {},
      });
    }
  }

  /**
   * Record task completion metrics
   */
  async recordTaskCompletion(task) {
    const completionTime = task.completedAt - task.startedAt;
    const qualityScore = this._calculateQualityScore(task);

    const metrics = {
      taskId: task.id,
      agentId: task.assignedTo,
      taskType: task.type,
      startedAt: task.startedAt,
      completedAt: task.completedAt,
      duration: completionTime,
      qualityScore,
      success: task.status === "COMPLETED",
      context: {
        projectSize: task.projectSize,
        complexity: task.complexity,
      },
    };

    // Save metrics
    const metricsPath = path.join(this.metricsPath, `${task.id}.json`);
    await fs.writeJson(metricsPath, metrics);

    // Update index
    await this._updateIndex(metrics);

    return metrics;
  }

  /**
   * Update metrics index with new task data
   */
  async _updateIndex(metrics) {
    const indexPath = path.join(this.metricsPath, "index.json");
    const index = await fs.readJson(indexPath);

    // Update agent metrics
    if (!index.agents[metrics.agentId]) {
      index.agents[metrics.agentId] = {
        totalTasks: 0,
        successfulTasks: 0,
        averageDuration: 0,
        averageQuality: 0,
        taskTypes: {},
      };
    }

    const agent = index.agents[metrics.agentId];
    agent.totalTasks++;
    if (metrics.success) agent.successfulTasks++;

    // Calculate new averages
    const successRate = agent.successfulTasks / agent.totalTasks;
    const newDuration =
      (agent.averageDuration * (agent.totalTasks - 1) + metrics.duration) / agent.totalTasks;
    const newQuality =
      (agent.averageQuality * (agent.totalTasks - 1) + metrics.qualityScore) / agent.totalTasks;

    agent.averageDuration = newDuration;
    agent.averageQuality = newQuality;
    agent.successRate = successRate;

    // Update task type metrics
    if (!agent.taskTypes[metrics.taskType]) {
      agent.taskTypes[metrics.taskType] = {
        count: 0,
        successCount: 0,
        averageDuration: 0,
        averageQuality: 0,
      };
    }

    const taskType = agent.taskTypes[metrics.taskType];
    taskType.count++;
    if (metrics.success) taskType.successCount++;

    taskType.averageDuration =
      (taskType.averageDuration * (taskType.count - 1) + metrics.duration) / taskType.count;
    taskType.averageQuality =
      (taskType.averageQuality * (taskType.count - 1) + metrics.qualityScore) / taskType.count;
    taskType.successRate = taskType.successCount / taskType.count;

    // Update global task type metrics
    if (!index.taskTypes[metrics.taskType]) {
      index.taskTypes[metrics.taskType] = {
        totalAgents: 0,
        averageSuccessRate: 0,
        bestAgent: null,
        bestAgentRate: 0,
      };
    }

    const globalTask = index.taskTypes[metrics.taskType];
    globalTask.totalAgents = Object.keys(agent.taskTypes).length;

    // Recalculate global averages
    let totalSuccess = 0;
    let totalCount = 0;

    Object.values(index.agents).forEach((agentMetrics) => {
      if (agentMetrics.taskTypes[metrics.taskType]) {
        const taskMetrics = agentMetrics.taskTypes[metrics.taskType];
        totalSuccess += taskMetrics.successCount;
        totalCount += taskMetrics.count;
      }
    });

    globalTask.averageSuccessRate = totalCount > 0 ? totalSuccess / totalCount : 0;

    // Find best agent for this task type
    let bestRate = 0;
    let bestAgent = null;

    Object.entries(index.agents).forEach(([agentId, agentMetrics]) => {
      if (agentMetrics.taskTypes[metrics.taskType]) {
        const rate = agentMetrics.taskTypes[metrics.taskType].successRate;
        if (rate > bestRate) {
          bestRate = rate;
          bestAgent = agentId;
        }
      }
    });

    globalTask.bestAgent = bestAgent;
    globalTask.bestAgentRate = bestRate;

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  /**
   * Calculate quality score for a task
   */
  _calculateQualityScore(task) {
    let score = 0.7; // Base score

    // Adjust based on verification results
    if (task.verification) {
      if (task.verification.technical && task.verification.technical.confidenceScore) {
        score = task.verification.technical.confidenceScore * 0.6;
      }

      if (task.verification.business && task.verification.business.confidenceScore) {
        score += task.verification.business.confidenceScore * 0.4;
      }
    }

    // Adjust for adherence to protocols
    if (task.protocolAdherence !== undefined) {
      score = score * 0.7 + task.protocolAdherence * 0.3;
    }

    return Math.min(1.0, Math.max(0.0, score));
  }

  /**
   * Get performance metrics for an agent
   */
  async getAgentMetrics(agentId) {
    const indexPath = path.join(this.metricsPath, "index.json");
    const index = await fs.readJson(indexPath);

    return index.agents[agentId] || null;
  }

  /**
   * Get the best agent for a specific task type
   */
  async getBestAgentForTask(taskType) {
    const indexPath = path.join(this.metricsPath, "index.json");
    const index = await fs.readJson(indexPath);

    const taskMetrics = index.taskTypes[taskType];
    return taskMetrics ? taskMetrics.bestAgent : null;
  }

  /**
   * Get performance insights for improvement
   */
  async getPerformanceInsights() {
    const indexPath = path.join(this.metricsPath, "index.json");
    const index = await fs.readJson(indexPath);

    const insights = [];

    // Find agents with low success rates
    Object.entries(index.agents).forEach(([agentId, metrics]) => {
      if (metrics.totalTasks >= 5 && metrics.successRate < 0.6) {
        insights.push({
          type: "AGENT_PERFORMANCE",
          target: agentId,
          issue: `Low success rate (${(metrics.successRate * 100).toFixed(1)}%)`,
          recommendation: "Consider retraining or modifying protocols for this agent",
          priority: 1 - metrics.successRate,
        });
      }
    });

    // Find task types with systemic issues
    Object.entries(index.taskTypes).forEach(([taskType, metrics]) => {
      if (metrics.averageSuccessRate < 0.5) {
        insights.push({
          type: "TASK_TYPE_ISSUE",
          target: taskType,
          issue: `Systemic issues with ${taskType} tasks (${(metrics.averageSuccessRate * 100).toFixed(1)}% success)`,
          recommendation: "Review task definition and agent capabilities for this task type",
          priority: 1 - metrics.averageSuccessRate,
        });
      }
    });

    return insights.sort((a, b) => b.priority - a.priority);
  }
}

// Export singleton instance
export default new AgentPerformance();
