import "../../../../tests/setup-frontend.js";
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ProjectSelector } from '../../../../dashboard/src/components/ProjectSelector';
import '@testing-library/jest-dom';
import { describe, it, expect } from 'bun:test';

describe.skip('ProjectSelector - Isolated Render Test', () => {
  it('should render without crashing', () => {
    render(<ProjectSelector onProjectSelect={() => {}} />);
    expect(screen.getByRole('button', { name: /find projects/i })).toBeInTheDocument();
  });
});