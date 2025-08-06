import { TrustAgentSelector } from './trust_agent_selector.js';
import { ExternalAgentBridge } from '../external/agent_bridge.js';
// We will add the ProductionValidator later.
// import { ProductionValidator } from '../validation/production_validator.js';

/**
 * Orchestrates a complex development goal using a hybrid of internal and external agents.
 */
export class HybridOrchestrator {
  constructor() {
    this.selector = new TrustAgentSelector();
    this.bridge = new ExternalAgentBridge();
    // this.validator = new ProductionValidator();
  }

  /**
   * Main entry point for the orchestration process.
   * @param {string} goal - The high-level goal, e.g., "Create a blog platform".
   * @returns {Promise<object>} The final, compiled result of the workflow.
   */
  async orchestrateWithHybridApproach(goal) {
    console.log(`🚀 Starting orchestration for goal: "${goal}"`);
    const workflow = await this.planHybridWorkflow(goal);

    for (const step of workflow.steps) {
      console.log(`▶️  Executing step: ${step.name}`);
      const agentDecision = await this.selector.selectBestAgent(step.task, step.context);
      console.log(`🧠 Selected Agent: ${agentDecision.agent} with confidence ${agentDecision.confidence.toFixed(2)}`);

      step.result = await this.executeStep(step, agentDecision);

      // TODO: Add validation step once the validator is built.
      // step.validation = await this.validator.validate(step.result);
    }

    return this.compileFinalResult(workflow);
  }

  /**
   * Executes a single workflow step using the selected agent.
   * @param {object} step - The workflow step.
   * @param {object} agentDecision - The decision from the TrustAgentSelector.
   * @returns {Promise<any>} The result from the agent execution.
   */
  async executeStep(step, agentDecision) {
    switch (agentDecision.agent) {
      case 'gemini':
        return this.bridge.executeWithGemini(step.task.prompt, step.context);
      case 'superdesign':
        return this.bridge.generateWithSuperDesign(step.task.prompt, step.context.existingDesigns);
      case 'internal':
        // Placeholder for internal agent execution
        console.log('  -> Executing with internal agent (placeholder)');
        return { status: 'completed by internal agent', task: step.task };
      case 'hybrid':
        return this.executeHybridStep(step);
      default:
        throw new Error(`Unknown agent selected: ${agentDecision.agent}`);
    }
  }

  /**
   * Executes a complex step using a combination of agents.
   * @param {object} step - The workflow step.
   * @returns {Promise<object>} A combined result from multiple agents.
   */
  async executeHybridStep(step) {
    console.log('  -> Executing with hybrid approach');
    const codePrompt = step.task.prompt.code || step.task.prompt;
    const uiPrompt = step.task.prompt.ui;

    const results = {};
    if (codePrompt) {
      results.code = await this.bridge.executeWithGemini(codePrompt, step.context);
    }
    if (uiPrompt) {
      results.ui = await this.bridge.generateWithSuperDesign(uiPrompt, step.context.existingDesigns);
    }

    // Placeholder for internal agent refinement
    results.refinement = { status: 'internal refinement placeholder' };

    return results;
  }

  /**
   * Creates a basic workflow plan from a high-level goal.
   * In the future, this could use an LLM for more sophisticated planning.
   * @param {string} goal - The high-level goal.
   * @returns {Promise<{steps: Array<object>}>} A workflow object.
   */
  async planHybridWorkflow(goal) {
    console.log('📝 Planning workflow...');
    // Simple planner: assumes a UI and a Code task for most web projects.
    const steps = [
      {
        name: 'UI/UX Design',
        task: { type: 'ui', complexity: 8, prompt: `Design UI/UX for: ${goal}` },
        context: { existingDesigns: [] }
      },
      {
        name: 'Code Generation',
        task: { type: 'code', complexity: 9, prompt: `Generate production-ready code for: ${goal}` },
        context: {}
      }
    ];
    console.log(`✅ Plan created with ${steps.length} steps.`);
    return { steps };
  }

  /**
   * Compiles the results from all workflow steps into a final report.
   * @param {object} workflow - The completed workflow.
   * @returns {object} A summary of the orchestration.
   */
  compileFinalResult(workflow) {
    console.log('✅ Orchestration complete. Compiling results...');
    return {
      goal: workflow.goal,
      summary: 'Workflow executed successfully.',
      steps: workflow.steps.map(step => ({
        name: step.name,
        result: step.result,
        validation: step.validation || 'pending'
      }))
    };
  }
}
