import { HybridOrchestrator } from '../src/orchestration/hybrid_orchestrator.js';
import { EvolvingAgent } from '../src/agents/evolving_agent.js';
import { ExternalAgentBridge } from '../src/external/agent_bridge.js';

// Mock the entire ExternalAgentBridge to avoid actual network calls during tests.
jest.mock('../src/external/agent_bridge.js');

describe('Hybrid System Integration Tests', () => {

  beforeEach(() => {
    // Clear all mocks before each test
    ExternalAgentBridge.mockClear();

    // Provide mock implementations for the bridge's methods
    ExternalAgentBridge.prototype.executeWithGemini = jest.fn().mockResolvedValue({
      status: 'success',
      files: [{ name: 'index.js', content: 'console.log("hello");' }],
      summary: 'Generated a simple file.'
    });

    ExternalAgentBridge.prototype.generateWithSuperDesign = jest.fn().mockResolvedValue({
      status: 'success',
      designs: [
        { id: 'design1', format: 'svg', content: '<svg>...</svg>' },
        { id: 'design2', format: 'svg', content: '<svg>...</svg>' }
      ],
      responsive: true
    });
  });

  describe('HybridOrchestrator', () => {
    test('should orchestrate a goal using both UI and code generation steps', async () => {
      const orchestrator = new HybridOrchestrator();
      const result = await orchestrator.orchestrateWithHybridApproach(
        'Create a responsive landing page with a contact form'
      );

      // Check that the plan was created
      expect(result.steps).toHaveLength(2);
      expect(result.steps[0].name).toBe('UI/UX Design');
      expect(result.steps[1].name).toBe('Code Generation');

      // Check that the bridge methods were called
      const bridgeInstance = ExternalAgentBridge.mock.instances[0];
      expect(bridgeInstance.generateWithSuperDesign).toHaveBeenCalled();
      expect(bridgeInstance.executeWithGemini).toHaveBeenCalled();

      // Check the final output structure
      expect(result.steps[0].result.designs).toHaveLength(2);
      expect(result.steps[1].result.files).toHaveLength(1);
    });
  });

  describe('EvolvingAgent', () => {
    test('should increase its trust score when internal and external results are similar', async () => {
      const agent = new EvolvingAgent('code');
      const initialScore = agent.getTrustScore();

      // Mock the quality comparison to return a small difference
      agent.compareQuality = jest.fn().mockResolvedValue(0.05);

      await agent.generateCode('Create a simple utility function');

      const finalScore = agent.getTrustScore();
      expect(finalScore).toBeGreaterThan(initialScore);
      expect(agent.compareQuality).toHaveBeenCalled();
    });

    test('should decrease its trust score when external results are much better', async () => {
      const agent = new EvolvingAgent('code');
      const initialScore = agent.getTrustScore();

      // Mock the quality comparison to return a large difference
      agent.compareQuality = jest.fn().mockResolvedValue(0.5);

      await agent.generateCode('Create a complex algorithm');

      const finalScore = agent.getTrustScore();
      expect(finalScore).toBeLessThan(initialScore);
    });
  });
});
