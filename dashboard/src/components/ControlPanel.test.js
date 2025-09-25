import { describe, test, expect, mock, afterEach, beforeAll } from 'bun:test';
import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ControlPanel from './ControlPanel';

// Mock the global fetch function before all tests to prevent network errors
beforeAll(() => {
  global.fetch = mock(() =>
    Promise.resolve({
      json: () => Promise.resolve({}),
      ok: true,
    })
  );
});

// Clean up the DOM after each test to prevent "multiple elements found" errors
afterEach(() => {
  cleanup();
});

describe('ControlPanel', () => {
  test('should prepend a command to the prompt when a URL is entered', () => {
    const mockSendMessage = mock();
    render(<ControlPanel sendMessage={mockSendMessage} engineStatus="Idle" />);

    const input = screen.getByPlaceholderText(/Enter your command or goal.../i);
    const form = input.closest('form'); // The button is a submit type, so we fire a form submit event
    const testUrl = 'https://example.com/some-article';

    fireEvent.change(input, { target: { value: testUrl } });
    fireEvent.submit(form);

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'user_chat_message',
      payload: {
        prompt: `Analyze the content of this webpage for me: ${testUrl}`
      },
    });
  });

  test('should not modify a standard, non-URL prompt', () => {
    const mockSendMessage = mock();
    render(<ControlPanel sendMessage={mockSendMessage} engineStatus="Idle" />);

    const input = screen.getByPlaceholderText(/Enter your command or goal.../i);
    const form = input.closest('form');
    const standardPrompt = 'Create a new component';

    fireEvent.change(input, { target: { value: standardPrompt } });
    fireEvent.submit(form);

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'user_chat_message',
      payload: { prompt: standardPrompt },
    });
  });
});
