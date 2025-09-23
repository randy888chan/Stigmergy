import { jest } from '@jest/globals';
import * as stateManager from '../../../engine/state_manager.js';
import { process_chat_command } from '../../../tools/chat_interface.js';
import { createStructuredResponse } from '../../../tools/core_tools.js';

jest.mock('../../../tools/core_tools.js', () => ({
  createStructuredResponse: jest.fn((data) => data),
  analyzeTaskExecutionStrategy: jest.fn(),
}));

jest.mock('../../../engine/state_manager.js', () => ({
  initializeProject: jest.fn().mockResolvedValue({}),
}));


describe('Chat Interface Tool', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should treat a development-related command as a new project goal', async () => {
    const command = 'Create a new API endpoint for users';
    await process_chat_command({ command });

    // Verify that initializeProject was called with the command
    expect(stateManager.initializeProject).toHaveBeenCalledWith(command);

    // Verify a structured response was created to inform the user
    expect(createStructuredResponse).toHaveBeenCalledWith(
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
    expect(createStructuredResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'clarification_needed',
      })
    );
  });
});
