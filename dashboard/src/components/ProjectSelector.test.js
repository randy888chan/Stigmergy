// Definitive Fix: New test file to resolve environment conflicts.
import "../../../tests/setup-dom.js";
import "../../setupTests.js";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProjectSelector from "./ProjectSelector";
import { mock } from "bun:test";

describe("ProjectSelector", () => {
  test('loads and displays projects when "Find Projects" is clicked', async () => {
    // Mock fetch locally for this test
    global.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(["project-a", "project-b"]),
      })
    );

    render(<ProjectSelector activeProject={null} onProjectSelect={() => {}} />);

    fireEvent.click(screen.getByRole("button", { name: "Find Projects" }));

    await waitFor(() => {
      const trigger = screen.getByRole("combobox");
      expect(trigger).toBeInTheDocument();
      // This assertion is more robust as it doesn't depend on specific placeholder text
      expect(screen.getByText("project-a")).toBeInTheDocument();
    });
  });
});
