import "../../../../tests/setup-frontend.js";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GovernanceDashboard } from '../../../../dashboard/src/components/GovernanceDashboard';
import '@testing-library/jest-dom';
import { mock, describe, it, expect, beforeEach } from 'bun:test';

// Mock fetch API
global.fetch = mock();

// Mock the entire accordion component module to prevent issues with Radix UI in tests
mock.module('../../../../dashboard/src/components/ui/accordion.jsx', () => ({
  Accordion: ({ children, ...props }) => <div {...props}>{children}</div>,
  AccordionItem: ({ children, ...props }) => <div {...props}>{children}</div>,
  AccordionTrigger: ({ children, ...props }) => <button {...props}>{children}</button>,
  AccordionContent: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

describe.skip('GovernanceDashboard', () => {
  // Updated mock data to match the component's expectations
  const mockProposals = [
    {
      id: 'prop1',
      reason: 'First test proposal reason',
      file_path: 'src/test1.js',
      new_content: 'console.log("hello");',
    },
    {
      id: 'prop2',
      reason: 'Second test proposal reason',
      file_path: 'src/test2.js',
      new_content: 'console.log("world");',
    },
  ];

  beforeEach(() => {
    // Clear mock history before each test
    fetch.mockClear();
     // Reset DOM between tests
    document.body.innerHTML = '';
  });

  it('renders a list of mock proposals', () => {
    render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} />);

    // Check that the reason for each proposal is displayed
    expect(screen.getByText('First test proposal reason')).toBeInTheDocument();
    expect(screen.getByText('Second test proposal reason')).toBeInTheDocument();
  });

  it('sends an approve request on button click', async () => {
    // Mock a successful fetch response
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} />);

    // Click the trigger to make the content visible
    const trigger = screen.getByText('First test proposal reason');
    fireEvent.click(trigger);

    // Find and click the approve button
    const approveButton = screen.getAllByRole('button', { name: /approve/i })[0];
    fireEvent.click(approveButton);

    // Wait for the fetch call to have been made with the correct parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/proposals/prop1/approve', expect.any(Object));
    });
  });

  it('sends a reject request on button click', async () => {
    // Mock a successful fetch response
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} />);

    // Click the trigger to make the content visible
    const trigger = screen.getByText('First test proposal reason');
    fireEvent.click(trigger);

    // Find and click the reject button
    const rejectButton = screen.getAllByRole('button', { name: /reject/i })[0];
    fireEvent.click(rejectButton);

    // Wait for the fetch call to have been made with the correct parameters
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/proposals/prop1/reject', expect.any(Object));
    });
  });

  it('does not show approve/reject buttons if isAdmin is false', () => {
    render(<GovernanceDashboard proposals={mockProposals} isAdmin={false} />);

    // Click the trigger to make the content visible
    const trigger = screen.getByText('First test proposal reason');
    fireEvent.click(trigger);

    // Verify that no approve or reject buttons are in the document
    const approveButtons = screen.queryAllByRole('button', { name: /approve/i });
    const rejectButtons = screen.queryAllByRole('button', { name: /reject/i });

    expect(approveButtons.length).toBe(0);
    expect(rejectButtons.length).toBe(0);
  });
});