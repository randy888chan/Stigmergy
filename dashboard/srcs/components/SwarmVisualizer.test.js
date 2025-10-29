import "../../../tests/setup-dom.js";
import { mock } from "bun:test";
import React from "react";
import { render, screen } from "@testing-library/react";
import SwarmVisualizer from "./SwarmVisualizer";

// Mock the WebSocket hook
mock.module("../hooks/useWebSocket", () => () => ({
  lastMessage: null,
}));

describe("SwarmVisualizer", () => {
  test("renders the canvas element for visualization", () => {
    render(<SwarmVisualizer />);
    const canvas = screen.getByRole("graphics-document"); // Canvas has an implicit role of graphics-document
    expect(canvas).toBeInTheDocument();
  });
});
