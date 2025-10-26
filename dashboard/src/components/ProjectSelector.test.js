import "../../../tests/setup-dom.js";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectSelector from "./ProjectSelector";

// Mock the global fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(["project-a", "project-b"]),
  })
);

describe("ProjectSelector", () => {
  test('loads and displays projects when "Find Projects" is clicked', async () => {
    render(<ProjectSelector activeProject={null} setActiveProject={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Find Projects" }));

    await waitFor(() => {
      expect(screen.getByText("Select a project")).toBeInTheDocument();
    });
  });
});
