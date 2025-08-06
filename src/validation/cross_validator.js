import { ExternalAgentBridge } from '../external/agent_bridge.js';

/**
 * Uses an external AI to validate and audit the results produced by other agents.
 */
export class CrossValidator {
  constructor() {
    this.bridge = new ExternalAgentBridge();
    this.auditThreshold = 0.8;
  }

  /**
   * Audits a given result against an original goal using an external AI.
   * If the audit score is below the threshold, it attempts to request improvements.
   * @param {object} resultToValidate - The artifact or code to be validated.
   * @param {string} originalGoal - The original goal that produced the result.
   * @returns {Promise<object>} The final audit result, potentially after improvements.
   */
  async validateWithExternalAudit(resultToValidate, originalGoal) {
    console.log('--- Starting External Cross-Validation Audit ---');
    const validationPrompt = this.createAuditPrompt(resultToValidate, originalGoal);

    const auditResult = await this.bridge.executeWithGemini(validationPrompt, { task: 'audit' });
    console.log(`  -> Initial audit score: ${auditResult.score}`);

    if (auditResult.score < this.auditThreshold && auditResult.issues && auditResult.issues.length > 0) {
      console.warn(`  -> Audit score below threshold. Requesting improvements...`);
      return await this.improveWithExternalGuidance(resultToValidate, auditResult.issues);
    }

    console.log('✅ External audit passed.');
    return { ...auditResult, status: 'passed' };
  }

  /**
   * Asks an external AI to improve a result based on a list of identified issues.
   * @param {object} resultToImprove - The artifact or code to be improved.
   * @param {Array<string>} issues - A list of issues identified in the audit.
   * @returns {Promise<object>} The improved result.
   */
  async improveWithExternalGuidance(resultToImprove, issues) {
    const improvementPrompt = this.createImprovementPrompt(resultToImprove, issues);
    const improvedResult = await this.bridge.executeWithGemini(improvementPrompt, { task: 'improve' });

    return { ...improvedResult, status: 'improved' };
  }

  /**
   * Creates the prompt for the external audit.
   * @private
   */
  createAuditPrompt(result, goal) {
    return `
    **AUDIT THIS ARTIFACT FOR PRODUCTION READINESS**

    **Original Goal:**
    ${goal}

    **Artifact to Audit:**
    \`\`\`json
    ${JSON.stringify(result, null, 2)}
    \`\`\`

    **Instructions:**
    Evaluate the artifact based on the following criteria and respond in JSON format.
    1.  **Code Quality:** Adherence to best practices, readability, and maintainability.
    2.  **Security:** Potential vulnerabilities (e.g., injection, XSS).
    3.  **Performance:** Potential bottlenecks or inefficient code.
    4.  **Completeness:** Does it fully address the original goal?
    5.  **Testability:** Is the code structured in a way that is easy to test?

    **Return JSON format:**
    {
      "passed": boolean,
      "score": number (0.0 to 1.0),
      "issues": ["A list of identified issues and suggestions for improvement."],
      "summary": "A brief summary of your findings."
    }
    `;
  }

  /**
   * Creates the prompt for requesting improvements.
   * @private
   */
  createImprovementPrompt(result, issues) {
    return `
    **IMPROVE THIS ARTIFACT BASED ON AUDIT FEEDBACK**

    **Original Artifact:**
    \`\`\`json
    ${JSON.stringify(result, null, 2)}
    \`\`\`

    **Issues to Address:**
    - ${issues.join('\n- ')}

    **Instructions:**
    Provide an improved version of the artifact that addresses all the listed issues while preserving the original functionality.
    Return only the improved JSON artifact.
    `;
  }
}
