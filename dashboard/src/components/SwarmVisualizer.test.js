import "../../../tests/setup-dom.js";
import "../../setupTests.js";
import React from "react";
import { render, screen } from "@testing-library/react";
import { GlobalRegistrator } from "@happy-dom/global-registrator";
import SwarmVisualizer from "./SwarmVisualizer";

// Mock the WebSocket hook
jest.mock("../hooks/useWebSocket", () => () => ({
  lastMessage: null,
}));

describe("SwarmVisualizer", () => {
  beforeAll(() => {
    GlobalRegistrator.register();
  });
  afterAll(() => {
    GlobalRegistrator.unregister();
  });
  test("renders the canvas element for visualization", () => {
    render(<SwarmVisualizer />);
    const canvas = screen.getByRole("graphics-document"); // Canvas has an implicit role of graphics-document
    expect(canvas).toBeInTheDocument();
  });
});
