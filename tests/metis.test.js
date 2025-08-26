import { jest } from '@jest/globals';
import createGuardianTools from '../tools/guardian_tool.js';

describe('Metis to Guardian Self-Improvement Workflow', () => {
  let mockEngine;
  let guardianTool;

  beforeEach(() => {
    // Create a mock of the core Engine for each test
    mockEngine = {
      triggerAgent: jest.fn().mockResolvedValue('Guardian task acknowledged.'),
    };
    // The guardian tool is a factory that needs the engine instance
    guardianTool = createGuardianTools(mockEngine).propose_change;
  });

  test('should allow @metis to propose a change and correctly trigger the @guardian agent', async () => {
    // Arrange: Simulate the proposal that @metis would create
    const proposal = {
      file_path: `${global.StigmergyConfig.core_path}/agents/debugger.md`,
      new_content: "agent: id: debugger\n...",
      reason: "Analysis of failure patterns indicates the debugger needs an updated protocol for database errors.",
    };

    // Act: Simulate @metis calling the guardian.propose_change tool
    const result = await guardianTool(proposal);

    // Assert
    // 1. Check that the engine's triggerAgent method was called
    expect(mockEngine.triggerAgent).toHaveBeenCalledTimes(1);

    // 2. Check that the correct agent (@guardian) was triggered
    expect(mockEngine.triggerAgent).toHaveBeenCalledWith(
      'guardian',
      expect.any(String) // We expect a detailed prompt string
    );

    // 3. Check that the prompt sent to the guardian contains the critical information
    const triggeredPrompt = mockEngine.triggerAgent.mock.calls[0][1];
    expect(triggeredPrompt).toContain('An automated system improvement has been proposed by @metis');
    expect(triggeredPrompt).toContain(proposal.file_path);
    expect(triggeredPrompt).toContain(proposal.new_content);
    expect(triggeredPrompt).toContain(proposal.reason);
    expect(triggeredPrompt).toContain('core.backup');

    // 4. Check that the tool returns a successful confirmation message
    expect(result).toContain('Proposal sent to @guardian. Response: Guardian task acknowledged.');
  });

  test('should throw an error if propose_change is called with missing arguments', async () => {
    // Arrange: An incomplete proposal from @metis
    const incompleteProposal = {
      file_path: `${global.StigmergyConfig.core_path}/agents/debugger.md`,
      // new_content is missing
      reason: "A reason without content.",
    };

    // Act & Assert: The tool should reject the call before it ever reaches the engine
    await expect(guardianTool(incompleteProposal)).rejects.toThrow(
      "The 'file_path', 'new_content', and 'reason' arguments are required for guardian.propose_change."
    );

    // Ensure the engine was never bothered with the invalid request
    expect(mockEngine.triggerAgent).not.toHaveBeenCalled();
  });
});
