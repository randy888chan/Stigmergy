// This is the definitive, working version of the test, combining architectural and code-level fixes.
import '../../../../tests/setup-dom.js'; // 1. Use the correct, comprehensive DOM setup.
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { ProjectSelector } from '../../../../dashboard/src/components/ProjectSelector';
import '@testing-library/jest-dom';

// 2. Mock modules that are problematic in a test environment.
mock.module('path-browserify', () => ({
  join: (...args) => args.join('/'),
}));

// 3. Mock the complex UI component that was causing crashes.
mock.module('../../../../dashboard/src/components/ui/select.jsx', () => ({
  Select: ({ children, onValueChange }) => <select onChange={(e) => onValueChange(e.target.value)}>{children}</select>,
  SelectContent: ({ children }) => <>{children}</>,
  SelectItem: ({ children, value }) => <option value={value}>{children}</option>,
  SelectTrigger: ({ children }) => <button>{children}</button>,
  SelectValue: ({ placeholder }) => <>{placeholder}</>,
}));

// 4. Set up a clean fetch mock for each test.
beforeEach(() => {
  global.fetch = mock(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve(['project-a', 'project-b']),
    })
  );
});

describe('ProjectSelector', () => {
  it('should fetch and display projects when the button is clicked', async () => {
    const user = userEvent.setup();
    const handleProjectSelect = mock(() => {});
    render(<ProjectSelector onProjectSelect={handleProjectSelect} />);

    // Click the button to fetch projects
    const findButton = screen.getByRole('button', { name: /find projects/i });
    await user.click(findButton);

    // Wait for the mocked <select> to be populated with <option>s
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'project-a' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'project-b' })).toBeInTheDocument();
    });

    // Simulate selecting a project from the dropdown
    const selectElement = screen.getByRole('combobox');
    await user.selectOptions(selectElement, 'project-b');

    // Verify that the parent component's callback was triggered with the correct full path
    await waitFor(() => {
        expect(handleProjectSelect).toHaveBeenCalledWith('~/project-b');
    });
  });
});