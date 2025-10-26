import "../../../tests/setup-dom.js";
// New content for dashboard/src/components/ExecutiveSummary.test.js
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import ExecutiveSummary from "./ExecutiveSummary";

const mockSuccessData = {
  overallSuccessRate: 95.5,
  averageTaskCompletionTime: 30000,
  totalEstimatedCost: 2.5,
  totalTasks: 150,
  agentReliabilityRankings: [{ agentId: "@executor", reliability: 99.0, tasks: 100 }],
};

describe("ExecutiveSummary", () => {
  test("shows a loading state initially", () => {
    global.fetch = jest.fn(() => new Promise(() => {})); // A promise that never resolves
    render(<ExecutiveSummary />);
    expect(screen.getByText(/Loading high-level metrics.../i)).toBeInTheDocument();
  });

  test("displays data correctly after a successful API call", async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockSuccessData),
      })
    );
    render(<ExecutiveSummary />);
    await waitFor(() => {
      expect(screen.getByText("Overall Success Rate")).toBeInTheDocument();
      expect(screen.getByText("95.5%")).toBeInTheDocument();
      expect(screen.getByText("30.00 s")).toBeInTheDocument(); // Formatted duration
    });
  });

  test("displays an error message if the API call fails", async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, statusText: "Server Error" }));
    render(<ExecutiveSummary />);
    await waitFor(() => {
      expect(screen.getByText(/Error: Failed to fetch executive summary/i)).toBeInTheDocument();
    });
  });
});
