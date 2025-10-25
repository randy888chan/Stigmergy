import React from 'react';
import { render, screen } from '@testing-library/react';
import ExecutiveSummary from './ExecutiveSummary';

test('renders Executive Summary loading state', () => {
render(<ExecutiveSummary />);
expect(screen.getByText(/Loading high-level metrics.../i)).toBeInTheDocument();
});
