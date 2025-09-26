import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';

// Mock the dependencies of the module we are testing.
// The chat_interface tool calls stateManager and coreTools.
mock.module('../../../engine/state_manager.js', () => ({
  initializeProject: mock().mockResolvedValue({}),
}));
mock.module('../../../tools/core_tools.js', () => ({
  createStructuredResponse: mock((data) => data), // Mock returns the data it received
}));

// NOW, we can safely import the modules. Bun will give us the mocked versions.
import * as stateManager from '../../../engine/state_manager.js';
import * as coreTools from '../../../tools/core_tools.js';
import { process_chat_command } from '../../../tools/chat_interface.js';

describe('Chat Interface Tool', () => {

  beforeEach(() => {
    // Reset call history for all mocks before each test
    mock.restore();
    stateManager.initializeProject.mockClear(); // Explicitly clear the mock
  });

  test('should call initializeProject for a development-related command', async () => {
    const command = 'Create a new API endpoint for users';
    await process_chat_command({ command });

    // VERIFY: The correct function was called for a development goal.
    expect(stateManager.initializeProject).toHaveBeenCalledWith(command);
    expect(coreTools.createStructuredResponse).toHaveBeenCalled();
  });

  test('should NOT call initializeProject for a system status command', async () => {
    const command = 'what is the system status';
    await process_chat_command({ command });

    // VERIFY: The development workflow was NOT triggered.
    expect(stateManager.initializeProject).not.toHaveBeenCalled();
    expect(coreTools.createStructuredResponse).toHaveBeenCalled();
  });

  test('should return a clarification message for an unknown command', async () => {
    const command = 'some random unknown command';
    await process_chat_command({ command });

    // VERIFY: The development workflow was NOT triggered.
    expect(stateManager.initializeProject).not.toHaveBeenCalled();

    // VERIFY: A clarification response was created.
    expect(coreTools.createStructuredResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'clarification_needed',
      })
    );
  });
});