import React from 'react';
import { render, screen } from '@testing-library/react';
import Dashboard from './Dashboard';

// Mock the heavy components that are not relevant to this test
jest.mock('../components/Terminal/Terminal.js', () => () => <div data-testid="terminal"></div>, { virtual: true });

test('should not render the Terminal component', () => {
  render(<Dashboard />);
  const terminalElement = screen.queryByTestId('terminal');
  // The queryBy* method returns null if the element is not found, which is what we want.
  expect(terminalElement).not.toBeInTheDocument();
});
