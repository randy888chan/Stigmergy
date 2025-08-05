/**
 * Business metrics and verification tools
 * Connects technical implementation to business outcomes
 */

const fs = require("fs-extra");
const path = require("path");
const natural = require("natural"); // For NLP analysis of goals

// Business objective types and their verification approaches
const OBJECTIVE_TYPES = {
  USER_ENGAGEMENT: {
    keywords: ["engage", "engagement", "retain", "active users", "session"],
    verification: "user_engagement",
  },
  REVENUE: {
    keywords: ["revenue", "sales", "monetize", "subscription", "pay"],
    verification: "revenue",
  },
  CONVERSION: {
    keywords: ["conversion", "sign up", "register", "purchase", "checkout"],
    verification: "conversion",
  },
  PERFORMANCE: {
    keywords: ["faster", "performance", "speed", "latency", "throughput"],
    verification: "performance",
  },
};

class BusinessMetrics {
  constructor() {
    this.classifier = new natural.LogisticRegressionClassifier();
    this._trainClassifier();
  }

  /**
   * Train the classifier to recognize business objective types
   */
  _trainClassifier() {
    // Train with examples for each objective type
    Object.entries(OBJECTIVE_TYPES).forEach(([type, config]) => {
      config.keywords.forEach((keyword) => {
        this.classifier.addClassDocument(type, keyword);
      });
    });

    this.classifier.train();
  }

  /**
   * Extract business objectives from project goal
   */
  async extractObjectives(goal) {
    // Use NLP to identify business objectives in the goal statement
    const objectiveStatements = this._identifyObjectiveStatements(goal);

    // Classify each statement
    return objectiveStatements.map((statement) => ({
      text: statement,
      type: this._classifyObjective(statement),
      measurable: this._isMeasurable(statement),
    }));
  }

  /**
   * Identify potential objective statements in text
   */
  _identifyObjectiveStatements(text) {
    // Split into sentences and filter for likely objectives
    const sentences = text
      .split(/[.!?]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    return sentences.filter(
      (sentence) =>
        sentence.toLowerCase().includes("want") ||
        sentence.toLowerCase().includes("need") ||
        sentence.toLowerCase().includes("should") ||
        sentence.toLowerCase().includes("goal") ||
        sentence.toLowerCase().includes("objective")
    );
  }

  /**
   * Classify an objective statement
   */
  _classifyObjective(statement) {
    const classification = this.classifier.getClassifications(statement);
    const topMatch = classification.sort((a, b) => b.value - a.value)[0];

    // Return the type if confidence is high enough
    return topMatch && topMatch.value > 0.6 ? topMatch.label : "GENERAL";
  }

  /**
   * Determine if an objective is measurable
   */
  _isMeasurable(statement) {
    const measurableIndicators = [
      "increase by",
      "decrease by",
      "%",
      "percent",
      "from X to Y",
      "double",
      "halve",
      "improve",
    ];

    return measurableIndicators.some((indicator) => statement.toLowerCase().includes(indicator));
  }

  /**
   * Check if analytics tracking is implemented for a metric
   */
  async checkAnalyticsTracking(projectPath, metric) {
    // Look for common analytics implementations
    const trackingFiles = [
      "src/analytics.js",
      "src/services/analytics.js",
      "src/utils/analytics.js",
    ];

    for (const file of trackingFiles) {
      const fullPath = path.join(projectPath, file);
      if (await fs.pathExists(fullPath)) {
        const content = await fs.readFile(fullPath, "utf-8");
        // Check for metric-specific tracking
        if (content.toLowerCase().includes(metric.toLowerCase())) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Check if expected user flows exist in the codebase
   */
  async checkUserFlows(projectPath, userFlows) {
    // For each user flow, check if related components exist
    const results = {};

    for (const flow of userFlows) {
      const flowName = flow.toLowerCase().replace(/\s+/g, "-");
      const searchPaths = [
        `src/components/**/${flowName}*.jsx`,
        `src/pages/**/${flowName}*.jsx`,
        `src/features/**/${flowName}*.jsx`,
      ];

      let found = false;
      for (const pattern of searchPaths) {
        const matches = await glob(pattern, { cwd: projectPath });
        if (matches.length > 0) {
          found = true;
          break;
        }
      }

      results[flow] = found;
    }

    return results;
  }

  /**
   * Filter to only measurable objectives
   */
  filterMeasurable(objectives) {
    return objectives.filter((obj) => obj.measurable);
  }

  /**
   * Run a simple user flow simulation
   */
  async runUserSimulation(projectPath, simulation) {
    // This would be enhanced with actual simulation capabilities
    // For now, just verify the simulation plan exists
    const simulationPath = path.join(projectPath, "docs", "simulations", `${simulation.id}.md`);

    const exists = await fs.pathExists(simulationPath);
    return {
      planExists: exists,
      executed: false, // Would be true if we actually ran the simulation
      results: null,
    };
  }
}

module.exports = new BusinessMetrics();
