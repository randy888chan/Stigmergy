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
mock.module('../../../../dashboard/src/components/ui/scroll-area.jsx', () => ({
  ScrollArea: ({ children }) => <div>{children}</div>,
}));

// Mock lucide-react
mock.module('lucide-react', () => ({
  Folder: () => <span>FolderIcon</span>,
  FolderUp: () => <span>FolderUpIcon</span>,
  Check: () => <span>CheckIcon</span>,
}));

describe('ProjectSelector', () => {
    let fetchSpy;

  beforeEach(() => {
    // Reset DOM between tests
    document.body.innerHTML = '';

    // Provide a mock implementation for this specific test
    fetchSpy = spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
          folders: ['project-a', 'project-b'],
          currentPath: '/mock/path'
      }), {
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

  it('should fetch and display folders on mount', async () => {
    const { findByText } = render(<ProjectSelector onProjectSelect={() => {}} />);
    const user = userEvent.setup();

    // Open the dropdown first
    const trigger = await findByText(/path/i);
    await user.click(trigger);

    // Wait for the component to render the project names from the mock response
    expect(await findByText('project-a')).toBeInTheDocument();
    expect(await findByText('project-b')).toBeInTheDocument();

    // Verify fetch was called correctly
    expect(fetchSpy).toHaveBeenCalledWith('/api/projects?basePath=~');
  });

  it('should call onProjectSelect with current path when Select This Project is clicked', async () => {
    const onSelect = mock(() => {});
    const { findByText } = render(<ProjectSelector onProjectSelect={onSelect} />);
    const user = userEvent.setup();

    // Open the dropdown
    const trigger = await findByText(/path/i);
    await user.click(trigger);

    const projectA = await findByText('project-a');
    expect(projectA).toBeInTheDocument();

    const selectButton = await findByText('Select This Project');
    await user.click(selectButton);

    expect(onSelect).toHaveBeenCalledWith('/mock/path');
  });
});