import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, mock, afterEach } from 'bun:test';
import { ProjectSelector } from '../../../dashboard/src/components/ProjectSelector';
import '@testing-library/jest-dom';

// Mock the path-browserify module
mock.module('path-browserify', () => ({
  join: (...args) => args.join('/'),
}));

// Mock the select component module
mock.module('../../../dashboard/src/components/ui/select.jsx', () => ({
  Select: ({ children }) => <div>{children}</div>,
  SelectContent: ({ children }) => <div>{children}</div>,
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }) => <button>{children}</button>,
  SelectValue: () => <span>Select a project</span>,
}));

describe('ProjectSelector', () => {
  // Restore fetch mock after each test
  const originalFetch = global.fetch;
  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should fetch and display projects when the button is clicked', async () => {
    // Mock the global fetch API
    global.fetch = mock(async (url) => {
      if (url.toString().endsWith('/api/projects')) {
        return new Response(JSON.stringify(['project-a', 'project-b']), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response('Not Found', { status: 404 });
    });

    const user = userEvent.setup();
    render(<ProjectSelector onProjectSelect={() => {}} />);

    // Simulate a user clicking the "Find Projects" button
    await user.click(screen.getByRole('button', { name: /find projects/i }));

    // Wait for the component to render the project names from the mock response
    await waitFor(() => {
      expect(screen.getByText('project-a')).toBeInTheDocument();
      expect(screen.getByText('project-b')).toBeInTheDocument();
    });
  });
});