import { jest, describe, test, expect, beforeEach } from '@jest/globals';

jest.unstable_mockModule("child_process", () => ({
  exec: jest.fn(),
}));

const { exec } = await import("child_process");
const { execute } = await import("../../../tools/shell.js");

describe("Shell Tool", () => {
  const mockAgentConfig = {
    alias: "test-agent",
    permitted_shell_commands: [".*"], // Allow all commands for testing
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should execute a permitted command successfully", async () => {
    exec.mockImplementation((command, options, callback) => {
      callback(null, { stdout: "mocked output", stderr: "" });
    });

    const result = await execute({
      command: "echo 'Hello World'",
      agentConfig: mockAgentConfig,
    });
    expect(result).toBe("mocked output");
  });

  test("should handle execution failure of a permitted command", async () => {
    const error = new Error("Command failed");
    error.stderr = "Error details";
    exec.mockImplementation((command, options, callback) => {
      callback(error, { stdout: "", stderr: "Error details" });
    });

    const result = await execute({
      command: "failingcommand",
      agentConfig: mockAgentConfig,
    });
    expect(result).toBe("EXECUTION FAILED: Error details");
  });

  test("should return an error string for a non-permitted command", async () => {
    const restrictiveAgentConfig = {
      alias: "test-agent",
      permitted_shell_commands: ["echo.*"], // Only allow echo commands
    };
    
    const result = await execute({ command: "ls", agentConfig: restrictiveAgentConfig });
    expect(result).toContain('EXECUTION FAILED: Security policy violation');
  });

  test("should return an error string if no command is provided", async () => {
    const result = await execute({ command: "", agentConfig: mockAgentConfig });
    expect(result).toContain("EXECUTION FAILED: No command provided.");
  });

  test("should allow specific commands if permitted", async () => {
    const restrictiveAgentConfig = {
      alias: "test-agent",
      permitted_shell_commands: ["echo.*"], // Allow echo commands
    };

    exec.mockImplementation((command, options, callback) => {
      const output = command.replace("echo ", "").replace(/'/g, "");
      callback(null, { stdout: output, stderr: "" });
    });
    
    const result = await execute({ command: "echo 'test'", agentConfig: restrictiveAgentConfig });
    expect(result).toBe("test");
  });
});