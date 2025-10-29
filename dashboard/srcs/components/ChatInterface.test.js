import "../../../tests/setup-dom.js";
import { mock } from "bun:test";
import React from "react";
import { render, screen } from "@testing-library/react";
import ChatInterface from "./ChatInterface";

// Mock the useChat hook from @ai-sdk/react
mock.module("@ai-sdk/react", () => ({
  useChat: () => ({
    messages: [],
    input: "",
    handleInputChange: mock.fn(),
    handleSubmit: mock.fn(),
  }),
}));

describe("ChatInterface", () => {
  test("renders with an active project and available engine", () => {
    render(
      <ChatInterface activeProject="test-project" isEngineBusy={false} isEngineReady={true} />
    );
    const input = screen.getByPlaceholderText("Enter your mission objective...");
    expect(input).toBeInTheDocument();
    expect(input).toBeEnabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeEnabled();
  });

  test("is disabled when the engine is busy", () => {
    render(<ChatInterface activeProject="test-project" isEngineBusy={true} isEngineReady={true} />);
    const input = screen.getByPlaceholderText("Engine is busy...");
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Busy" })).toBeDisabled();
  });

  test("is disabled when no project is active", () => {
    render(<ChatInterface activeProject={null} isEngineBusy={false} isEngineReady={true} />);
    const input = screen.getByPlaceholderText("Set a project first...");
    expect(input).toBeInTheDocument();
    expect(input).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send" })).toBeDisabled();
  });
});
