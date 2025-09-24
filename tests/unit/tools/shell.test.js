import { jest, describe, test, expect } from 'bun:test';
const { execute } = await import("../../../tools/shell.js");


describe("Shell Tool", () => {
  const mockAgentConfig = {
    alias: "test-agent",
    permitted_shell_commands: [".*"], // Allow all commands for testing
  };

  test("should execute a permitted command successfully", async () => {
    const mockExecPromise = jest.fn().mockResolvedValue({ stdout: "mocked output", stderr: "" });

    const result = await execute({
      command: "echo 'Hello World'",
      agentConfig: mockAgentConfig,
      execPromise: mockExecPromise,
    });
    expect(result).toBe("mocked output");
    expect(mockExecPromise).toHaveBeenCalledWith("echo 'Hello World'", { timeout: 5000 });
  });

  test("should handle execution failure of a permitted command", async () => {
    const error = new Error("Command failed");
    error.stderr = "Error details";
    const mockExecPromise = jest.fn().mockRejectedValue(error);

    const result = await execute({
      command: "failingcommand",
      agentConfig: mockAgentConfig,
      execPromise: mockExecPromise,
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
    const mockExecPromise = jest.fn().mockImplementation(async (command) => {
        const output = command.replace("echo ", "").replace(/'/g, "");
        return { stdout: output, stderr: "" };
    });
    
    const result = await execute({ command: "echo 'test'", agentConfig: restrictiveAgentConfig, execPromise: mockExecPromise });
    expect(result).toBe("test");
  });
});
