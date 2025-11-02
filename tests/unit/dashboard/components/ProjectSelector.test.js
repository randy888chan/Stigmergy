import "../../../../tests/setup-frontend.js";
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectSelector } from '../../../../dashboard/src/components/ProjectSelector';
import '@testing-library/jest-dom';
import { describe, it, expect, mock } from 'bun:test';

// Mock the path-browserify module to prevent import/resolution issues in the test environment.
mock.module('path-browserify', () => ({
  join: (...args) => args.join('/'),
}));

describe('ProjectSelector - Isolated Render Test', () => {
  it('should render without crashing', () => {
    const { getByRole } = render(<ProjectSelector onProjectSelect={() => {}} />);
    expect(getByRole('button', { name: /find projects/i })).toBeInTheDocument();
  });
});