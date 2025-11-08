import '../../../../tests/setup-dom.js';
import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { ProjectSelector } from '../../../../dashboard/src/components/ProjectSelector';
import '@testing-library/jest-dom';
import { spyOn } from 'bun:test';

// Mock the path-browserify module
const mockPath = {
  join: (...args) => args.join('/'),
};
mock.module('path-browserify', () => ({
  ...mockPath,
  default: mockPath,
}));

// Mock the shadcn/ui components
mock.module('../../../../dashboard/src/components/ui/button.jsx', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}));
mock.module('../../../../dashboard/src/components/ui/input.jsx', () => ({
  Input: (props) => <input {...props} />,
}));
mock.module('../../../../dashboard/src/components/ui/select.jsx', () => ({
  Select: ({ children, ...props }) => <select {...props}>{children}</select>,
  SelectContent: ({ children, ...props }) => <div {...props}>{children}</div>,
  SelectItem: ({ children, ...props }) => <option {...props}>{children}</option>,
  SelectTrigger: ({ children, ...props }) => <div {...props}>{children}</div>,
  SelectValue: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe('ProjectSelector', () => {
    let fetchSpy;

  beforeEach(() => {
    // Reset DOM between tests
    document.body.innerHTML = '';

    // Provide a mock implementation for this specific test
    fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(['project-a', 'project-b']), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
  });

  afterEach(() => {
    // Restore the original fetch function to avoid side effects
    if (fetchSpy) {
      fetchSpy.mockRestore();
    }
  });

  it('should fetch and display projects when the button is clicked', async () => {

    const user = userEvent.setup();
    const { getByTestId, getByText } = render(<ProjectSelector onProjectSelect={() => {}} />);

    // Simulate a user clicking the "Find Projects" button
    await user.click(getByTestId('find-projects-button'));

    // Wait for the component to render the project names from the mock response
    await waitFor(() => {
      expect(getByText('project-a')).toBeInTheDocument();
      expect(getByText('project-b')).toBeInTheDocument();
    });

    // Verify fetch was called correctly
    expect(fetchSpy).toHaveBeenCalledWith('/api/projects?basePath=~');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});