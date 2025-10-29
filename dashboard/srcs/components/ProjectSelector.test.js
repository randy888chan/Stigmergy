import "../../../tests/setup-dom.js";
import { mock } from "bun:test";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectSelector from "./ProjectSelector";

// Mock the global fetch
global.fetch = mock.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(["project-a", "project-b"]),
  })
);

describe("ProjectSelector", () => {
  test('loads and displays projects when "Find Projects" is clicked', async () => {
    render(<ProjectSelector activeProject={null} onProjectSelect={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Find Projects" }));

    await waitFor(() => {
      // The placeholder is inside the combobox trigger for the Select component
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
      expect(trigger).toHaveTextContent(/select a project/i);
    });
  });
});
