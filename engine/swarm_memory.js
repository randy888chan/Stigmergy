/**
 * Swarm Memory System
 * Retains lessons across projects for continuous improvement
 */

const fs = require("fs-extra");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
import * as AgentPerformance from "./agent_performance.js";

class SwarmMemory {
  constructor() {
    this.memoryPath = path.join(process.cwd(), ".ai", "swarm_memory");
    this.errorPatterns = new Map();
    this.initialize();
  }

  /**
   * Initialize memory system
   */
  async initialize() {
    await fs.ensureDir(this.memoryPath);

    // Create memory index if it doesn't exist
    const indexPath = path.join(this.memoryPath, "index.json");
    if (!(await fs.pathExists(indexPath))) {
      await fs.writeJson(indexPath, {
        version: "1.0",
        entries: [],
        patterns: {},
      });
    }
  }

  /**
   * Record a lesson learned from project activity
   */
  async recordLesson(lesson) {
    // Store patterns for future reference
    this.errorPatterns.set(lesson.pattern, lesson.solution);

    // Update agent performance metrics
    await AgentPerformance.recordResolution(
      lesson.agentId,
      lesson.taskType,
      lesson.success
    );
  }

  /**
   * Update the memory index with a new entry
   */
  async _updateIndex(entry) {
    const indexPath = path.join(this.memoryPath, "index.json");
    const index = await fs.readJson(indexPath);

    // Add to entries
    index.entries.push({
      id: entry.id,
      timestamp: entry.timestamp,
      context: entry.context,
      outcome: entry.outcome,
      confidence: entry.confidence,
      tags: entry.tags,
    });

    // Update pattern recognition
    this._updatePatterns(index, entry);

    await fs.writeJson(indexPath, index, { spaces: 2 });
  }

  /**
   * Update pattern recognition based on new entry
   */
  _updatePatterns(index, entry) {
    // Simple pattern recognition for now
    // Would be enhanced with ML in future
    entry.tags.forEach((tag) => {
      if (!index.patterns[tag]) {
        index.patterns[tag] = {
          count: 1,
          successfulOutcomes: entry.outcome === "SUCCESS" ? 1 : 0,
          total: 1,
        };
      } else {
        index.patterns[tag].count++;
        index.patterns[tag].total++;
        if (entry.outcome === "SUCCESS") {
          index.patterns[tag].successfulOutcomes++;
        }
      }
    });
  }

  /**
   * Retrieve relevant lessons for a given context
   */
  async getRelevantLessons(context, tags = [], minConfidence = 0.6) {
    const indexPath = path.join(this.memoryPath, "index.json");
    const index = await fs.readJson(indexPath);

    // Filter entries that match context and tags
    const relevant = index.entries.filter((entry) => {
      // Check confidence threshold
      if (entry.confidence < minConfidence) return false;

      // Check tag relevance
      if (tags.length > 0) {
        const hasRelevantTag = tags.some((tag) => entry.tags.includes(tag));
        if (!hasRelevantTag) return false;
      }

      // Check context relevance (simplified)
      return this._contextMatches(entry.context, context);
    });

    // Sort by confidence and recency
    return relevant.sort((a, b) => {
      // Higher confidence first
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      // More recent first
      return new Date(b.timestamp) - new Date(a.timestamp);
    });
  }

  /**
   * Simple context matching
   */
  _contextMatches(entryContext, queryContext) {
    // In a real implementation, this would use NLP
    const entryText = JSON.stringify(entryContext).toLowerCase();
    const queryText = JSON.stringify(queryContext).toLowerCase();

    return entryText.includes(queryText) || queryText.includes(entryText);
  }

  /**
   * Get pattern-based recommendations
   */
  async getPatternRecommendations(context, tags = []) {
    const indexPath = path.join(this.memoryPath, "index.json");
    const index = await fs.readJson(indexPath);

    // Find relevant patterns
    const relevantPatterns = Object.entries(index.patterns)
      .filter(([tag, pattern]) => tags.length === 0 || tags.includes(tag))
      .map(([tag, pattern]) => ({
        tag,
        successRate: pattern.successfulOutcomes / pattern.total,
        count: pattern.total,
      }))
      .filter((pattern) => pattern.successRate > 0.7 && pattern.count >= 3)
      .sort((a, b) => b.successRate - a.successRate);

    return relevantPatterns;
  }

  /**
   * Suggest system improvements based on patterns
   */
  async suggestImprovements() {
    const indexPath = path.join(this.memoryPath, "index.json");
    const index = await fs.readJson(indexPath);

    const improvements = [];

    // Look for patterns with high failure rates
    Object.entries(index.patterns).forEach(([tag, pattern]) => {
      const successRate = pattern.successfulOutcomes / pattern.total;

      if (successRate < 0.4 && pattern.total >= 5) {
        improvements.push({
          pattern: tag,
          issue: `Low success rate (${(successRate * 100).toFixed(1)}%) for pattern`,
          recommendation: this._generateRecommendation(tag),
          confidence: 1 - successRate,
        });
      }
    });

    return improvements.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate improvement recommendation for a pattern
   */
  _generateRecommendation(patternTag) {
    // Simple mapping for now
    const recommendations = {
      "database-connection": "Implement connection pooling and automatic retry mechanisms",
      "api-integration": "Add robust error handling and fallback implementations",
      "feature-complexity": "Break down complex features into smaller, incremental implementations",
      "testing-gap": "Increase test coverage for critical paths identified in failures",
    };

    return (
      recommendations[patternTag] ||
      "Consider revising the approach for this pattern based on failure analysis"
    );
  }
}

// Export singleton instance
module.exports = new SwarmMemory();
