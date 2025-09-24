import { jest, describe, test, expect, afterEach, beforeEach } from '@jest/globals';

// Mock dependencies using the ESM-compatible API
jest.unstable_mockModule('../../../tools/core_tools.js', () => ({
  createStructuredResponse: jest.fn((data) => data),
  analyzeTaskExecutionStrategy: jest.fn(),
}));

jest.unstable_mockModule('../../../engine/state_manager.js', () => ({
  initializeProject: jest.fn().mockResolvedValue({}),
}));


describe('Chat Interface Tool', () => {
  let stateManager;
  let coreTools;
  let process_chat_command;

  beforeEach(async () => {
    // Dynamically import modules to get the mocked versions
    stateManager = await import('../../../engine/state_manager.js');
    coreTools = await import('../../../tools/core_tools.js');
    const chatInterface = await import('../../../tools/chat_interface.js');
    process_chat_command = chatInterface.process_chat_command;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should treat a development-related command as a new project goal', async () => {
    const command = 'Create a new API endpoint for users';
    await process_chat_command({ command });

    // Verify that initializeProject was called with the command
    expect(stateManager.initializeProject).toHaveBeenCalledWith(command);

    // Verify a structured response was created to inform the user
    expect(coreTools.createStructuredResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'in_progress',
        message: expect.stringContaining('Received new goal'),
      })
    );
  });

  test('should not call initializeProject for a status command', async () => {
    const command = 'what is the system status?';
    await process_chat_command({ command });

    // Verify that initializeProject was NOT called
    expect(stateManager.initializeProject).not.toHaveBeenCalled();
  });

  test('should not call initializeProject for a help command', async () => {
    const command = 'how do I get started?';
    await process_chat_command({ command });

    // Verify that initializeProject was NOT called
    expect(stateManager.initializeProject).not.toHaveBeenCalled();
  });

  test('should return a clarification message for an unknown command', async () => {
    const command = 'random gibberish command';
    await process_chat_command({ command });

    // Verify that initializeProject was NOT called
    expect(stateManager.initializeProject).not.toHaveBeenCalled();

    // Verify that a clarification response was created
    expect(coreTools.createStructuredResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'clarification_needed',
      })
    );
  });
});
