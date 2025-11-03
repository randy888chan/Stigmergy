import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, mock } from 'bun:test';
import { ChatInterface, BUSY_STATUSES } from './ChatInterface';
import '../../../../tests/setup-dom';

mock.module('@ai-sdk/react', () => ({
  useChat: mock(() => ({
    messages: [],
    input: '',
    handleInputChange: mock(),
    handleSubmit: mock(),
  })),
}));

import { useChat } from '@ai-sdk/react';

describe('ChatInterface', () => {
  it('should disable input and button when no project is active', () => {
    render(<ChatInterface engineStatus="IDLE" activeProject={null} />);
    expect(screen.getByPlaceholderText('Set a project first...')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
  });

  BUSY_STATUSES.forEach(status => {
    it(`should disable input and button when engine status is ${status}`, () => {
      render(<ChatInterface engineStatus={status} activeProject="project-a" />);
      expect(screen.getByPlaceholderText('Engine is busy...')).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Busy' })).toBeDisabled();
    });
  });

  it('should enable input and button when a project is active and engine is IDLE', () => {
    useChat.mockReturnValue({
      messages: [],
      input: 'Test mission',
      handleInputChange: mock(),
      handleSubmit: mock(),
    });

    render(<ChatInterface engineStatus="IDLE" activeProject="project-a" />);
    expect(screen.getByPlaceholderText('Enter your mission objective...')).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
  });
});