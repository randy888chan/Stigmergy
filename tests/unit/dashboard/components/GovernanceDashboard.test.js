import '../../../../tests/setup-dom.js';
import React from 'react';
// REMOVED `screen` from this import
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GovernanceDashboard } from '../../../../dashboard/src/components/GovernanceDashboard';
import { mock, describe, it, expect, beforeEach } from 'bun:test';
import '@testing-library/jest-dom';

// Mock fetch API globally for this test file
global.fetch = mock();

describe('GovernanceDashboard', () => {
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
    fetch.mockClear();
    document.body.innerHTML = '';
  });

  it('renders a list of mock proposals but hides content initially', () => {
    const { getByText, queryByText } = render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} fetchProposals={() => {}} authToken="test-token" adminToken="test-admin-token" />);

    // Reasons (triggers) should be visible
    expect(getByText('First test proposal reason')).toBeInTheDocument();
    expect(getByText('Second test proposal reason')).toBeInTheDocument();

    // Content should not be visible because the accordion is collapsed
    expect(queryByText('console.log("hello");')).not.toBeInTheDocument();
  });

  it('expands proposal on click and shows content', async () => {
    const user = userEvent.setup();
    const { getByText, findByText, getByRole } = render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} fetchProposals={() => {}} authToken="test-token" adminToken="test-admin-token" />);

    const trigger = getByText('First test proposal reason');
    await user.click(trigger);

    // Content should now be visible
    const fileContent = await findByText('console.log("hello");');
    expect(fileContent).toBeVisible();

    const approveButton = getByRole('button', { name: /approve/i });
    expect(approveButton).toBeVisible();
  });

  it('sends an approve request and refreshes proposals on button click', async () => {
    const user = userEvent.setup();
    const mockFetchProposals = mock(() => {});
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const { getByText, findByRole } = render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} fetchProposals={mockFetchProposals} authToken="test-token" adminToken="test-admin-token" />);

    // Click the trigger to make the content visible
    const trigger = getByText('First test proposal reason');
    await user.click(trigger);

    // Find and click the approve button
    const approveButton = await findByRole('button', { name: /approve/i });
    await user.click(approveButton);

    // Assert fetch was called correctly
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/proposals/prop1/approve', expect.any(Object));
    });

    // Assert the refresh function was called
    expect(mockFetchProposals).toHaveBeenCalledTimes(1);
  });

  it('sends a reject request and refreshes proposals on button click', async () => {
    const user = userEvent.setup();
    const mockFetchProposals = mock(() => {});
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) });

    const { getByText, findByRole } = render(<GovernanceDashboard proposals={mockProposals} isAdmin={true} fetchProposals={mockFetchProposals} authToken="test-token" adminToken="test-admin-token" />);

    const trigger = getByText('First test proposal reason');
    await user.click(trigger);

    const rejectButton = await findByRole('button', { name: /reject/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/proposals/prop1/reject', expect.any(Object));
    });

    expect(mockFetchProposals).toHaveBeenCalledTimes(1);
  });

  it('does not show approve/reject buttons if isAdmin is false', async () => {
    const user = userEvent.setup();
    const { getByText, findByText, queryByRole } = render(<GovernanceDashboard proposals={mockProposals} isAdmin={false} fetchProposals={() => {}} authToken="test-token" adminToken="test-admin-token" />);

    const trigger = getByText('First test proposal reason');
    await user.click(trigger);

    // Content should be visible
    expect(await findByText('console.log("hello");')).toBeVisible();

    // But buttons should not be present
    expect(queryByRole('button', { name: /approve/i })).not.toBeInTheDocument();
    expect(queryByRole('button', { name: /reject/i })).not.toBeInTheDocument();
  });
});