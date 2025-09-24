import React from 'react';
import { render, screen } from '@testing-library/react';
import { mock, test, expect } from 'bun:test';

// Mock the heavy components that are not relevant to this test using the ESM-compatible API
mock.module('../components/Terminal/Terminal.js', () => ({
  // The mock needs to be a default export that is a function component
  default: () => <div data-testid="terminal"></div>,
}));

test('should not render the Terminal component', async () => {
  // Dynamically import the component under test AFTER the mock is set up
  const Dashboard = (await import('./Dashboard.js')).default;

  render(<Dashboard />);

  const terminalElement = screen.queryByTestId('terminal');
  // The queryBy* method returns null if the element is not found, which is what we want.
  expect(terminalElement).toBeNull();
});
