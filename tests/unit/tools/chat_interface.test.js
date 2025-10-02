import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createChatProcessor } from '../../../tools/chat_interface.js';

// Mock the core_tools dependency, as it's not the focus of this unit test.
const mockCreateStructuredResponse = mock((data) => data);
mock.module('../../../tools/core_tools.js', () => ({
  createStructuredResponse: mockCreateStructuredResponse,
}));

describe('Chat Interface Tool', () => {
  let process_chat_command;
  let mockStateManager;
  const mockInitializeProject = mock(async () => ({}));

  beforeEach(() => {
    // Reset mocks
    mockInitializeProject.mockClear();
    mockCreateStructuredResponse.mockClear();

    // Create a fresh mock stateManager for each test
    mockStateManager = {
      initializeProject: mockInitializeProject,
    };

    // Create the tool function using the factory, injecting the mock dependency
    process_chat_command = createChatProcessor(mockStateManager);
  });

  afterEach(() => {
    // Restore any global mocks if necessary
    mock.restore();
  });

  test('should call initializeProject for a development-related command', async () => {
    const command = 'Create a new API endpoint for users';
    await process_chat_command({ command });

    // VERIFY: The correct function on the injected stateManager was called.
    expect(mockInitializeProject).toHaveBeenCalledWith(command);
    expect(mockCreateStructuredResponse).toHaveBeenCalled();
  });

  test('should NOT call initializeProject for a system status command', async () => {
    const command = 'what is the system status';
    await process_chat_command({ command });

    // VERIFY: The development workflow was NOT triggered.
    expect(mockInitializeProject).not.toHaveBeenCalled();
    expect(mockCreateStructuredResponse).toHaveBeenCalled();
  });

  test('should return a clarification message for an unknown command', async () => {
    const command = 'some random unknown command';
    await process_chat_command({ command });

    // VERIFY: The development workflow was NOT triggered.
    expect(mockInitializeProject).not.toHaveBeenCalled();

    // VERIFY: A clarification response was created.
    expect(mockCreateStructuredResponse).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'clarification_needed',
      })
    );
  });
});