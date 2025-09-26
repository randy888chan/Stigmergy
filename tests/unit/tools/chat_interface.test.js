import { mock, describe, test, expect, afterEach, beforeEach } from 'bun:test';

describe('Chat Interface Tool', () => {
  let stateManager;
  let coreTools;
  let process_chat_command;

  beforeEach(async () => {
    // Mock only the specific functions we need for this test
    mock.module('../../../tools/core_tools.js', () => ({
      createStructuredResponse: mock((data) => data),
      analyzeTaskExecutionStrategy: mock(),
    }));

    mock.module('../../../engine/state_manager.js', () => ({
      initializeProject: mock().mockResolvedValue({}),
    }));

    // Dynamically import modules to get the mocked versions
    stateManager = await import('../../../engine/state_manager.js');
    coreTools = await import('../../../tools/core_tools.js');
    const chatInterface = await import('../../../tools/chat_interface.js');
    process_chat_command = chatInterface.process_chat_command;
  });

  afterEach(() => {
    mock.restore();
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