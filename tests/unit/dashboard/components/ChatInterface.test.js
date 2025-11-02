import "../../../../tests/setup-frontend.js";
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChatInterface } from '../../../../dashboard/src/components/ChatInterface';
import '@testing-library/jest-dom';
import { describe, test, expect, jest } from 'bun:test';

describe.skip('ChatInterface', () => {
    const sendMessage = jest.fn();
    const BUSY_STATUSES = ["ENRICHMENT_PHASE", "PLANNING_PHASE", "CODING_PHASE", "TESTING_PHASE", "DEBUGGING_PHASE", "EXECUTING", "Running"];

    // Test for initial state (no project)
    test('input field and send button are disabled when no project is active', () => {
        render(<ChatInterface sendMessage={sendMessage} engineStatus="IDLE" activeProject="" />);
        expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
    });

    // Test for busy statuses
    BUSY_STATUSES.forEach(status => {
        test(`input field and send button are disabled when engineStatus is ${status}`, () => {
            render(<ChatInterface sendMessage={sendMessage} engineStatus={status} activeProject="/path/to/project" />);
            expect(screen.getByPlaceholderText('Type your message...')).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Send' })).toBeDisabled();
        });
    });

    // Test for enabled state
    test('input field and send button are enabled when a project is active and engine is IDLE', () => {
        render(<ChatInterface sendMessage={sendMessage} engineStatus="IDLE" activeProject="/path/to/project" />);
        expect(screen.getByPlaceholderText('Type your message...')).toBeEnabled();
        expect(screen.getByRole('button', { name: 'Send' })).toBeEnabled();
    });
});