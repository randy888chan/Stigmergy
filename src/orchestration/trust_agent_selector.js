/**
 * Selects the best agent for a given task based on a trust scoring system.
 */
export class TrustAgentSelector {
  constructor() {
    // These scores can be made dynamic in the future, based on performance.
    this.agentTrustScores = new Map([
      ['internal', 0.7],      // Baseline score for learning internal agents
      ['gemini', 0.9],        // High trust for a proven external tool
      ['superdesign', 0.95],  // Very high trust for specialized UI/UX tasks
      ['hybrid', 0.85]        // A combined approach for complex tasks
    ]);

    this.fallbackStrategy = 'gemini'; // Default to a reliable external agent
  }

  /**
   * Selects the best agent and strategy for a given task.
   * @param {object} task - The task object, expected to have `type` and `complexity`.
   * @param {object} context - The context for the task.
   * @returns {Promise<{agent: string, confidence: number, strategy: string}>}
   */
  async selectBestAgent(task, context) {
    const scores = await this.calculateTaskScores(task, context);

    // Find the agent with the highest score
    const bestAgent = Object.entries(scores)
      .reduce((best, current) => current[1] > best[1] ? current : best, ['', -1])[0];

    if (!bestAgent) {
      return { agent: this.fallbackStrategy, confidence: this.agentTrustScores.get(this.fallbackStrategy), strategy: 'fallback' };
    }

    return {
      agent: bestAgent,
      confidence: scores[bestAgent],
      strategy: this.determineStrategy(task, bestAgent)
    };
  }

  /**
   * Calculates confidence scores for each agent type based on the task.
   * @param {object} task - The task object, e.g., { type: 'code', complexity: 8 }
   * @returns {Promise<{[key: string]: number}>} A map of agent names to confidence scores.
   */
  async calculateTaskScores(task) {
    const scores = {};

    // Internal agent score - will be dynamic in the future
    scores.internal = await this.getInternalAgentScore(task);

    // External tool scores are weighted by task type
    scores.gemini = task.type === 'code' ? this.agentTrustScores.get('gemini') : 0.6;
    scores.superdesign = task.type === 'ui' || task.type === 'ux' ? this.agentTrustScores.get('superdesign') : 0.3;

    // Hybrid approach is preferred for complex tasks
    scores.hybrid = (task.complexity || 0) > 7 ? this.agentTrustScores.get('hybrid') : 0.5;

    return scores;
  }

  /**
   * Determines the execution strategy based on the task and selected agent.
   * @param {object} task - The task object.
   * @param {string} bestAgent - The name of the agent with the highest score.
   * @returns {string} The determined strategy.
   */
  determineStrategy(task, bestAgent) {
    if (bestAgent === 'hybrid') {
      return 'delegate-and-combine';
    }
    if (bestAgent === 'internal') {
      return 'internal-only-with-audit';
    }
    return 'external-direct';
  }

  /**
   * Placeholder for retrieving the internal agent's score.
   * In the future, this will query a performance tracking system.
   * @param {object} task - The task object.
   * @returns {Promise<number>} The trust score for the internal agent.
   */
  async getInternalAgentScore(task) {
    // TODO: Implement dynamic scoring based on historical performance data.
    // For now, return the baseline score.
    return this.agentTrustScores.get('internal');
  }
}
