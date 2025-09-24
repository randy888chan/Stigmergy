import { describe, it, expect, jest } from '@jest/globals';
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ControlPanel from './ControlPanel';

describe('ControlPanel', () => {
  it('should prepend a command to the prompt when a URL is entered', () => {
    const mockSendMessage = jest.fn();
    render(<ControlPanel sendMessage={mockSendMessage} engineStatus="Idle" />);

    const input = screen.getByPlaceholderText(/Enter your command or goal.../i);
    const button = screen.getByText('Send');
    const testUrl = 'https://example.com/some-article';

    fireEvent.change(input, { target: { value: testUrl } });
    fireEvent.click(button);

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'user_chat_message',
      payload: {
        prompt: `Analyze the content of this webpage for me: ${testUrl}`
      },
    });
  });

  it('should not modify a standard, non-URL prompt', () => {
    const mockSendMessage = jest.fn();
    render(<ControlPanel sendMessage={mockSendMessage} engineStatus="Idle" />);

    const input = screen.getByPlaceholderText(/Enter your command or goal.../i);
    const button = screen.getByText('Send');
    const standardPrompt = 'Create a new component';

    fireEvent.change(input, { target: { value: standardPrompt } });
    fireEvent.click(button);

    expect(mockSendMessage).toHaveBeenCalledWith({
      type: 'user_chat_message',
      payload: { prompt: standardPrompt },
    });
  });
});
