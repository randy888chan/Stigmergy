import { execute } from "../../../tools/shell.js";

describe("Shell Tool", () => {
  const mockAgentConfig = {
    alias: "test-agent",
    permitted_shell_commands: [".*"], // Allow all commands for testing
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should execute a permitted command successfully", async () => {
    // Use a simple shell command that should work on most systems
    const result = await execute({ command: "echo 'Hello World'", agentConfig: mockAgentConfig });
    expect(result).toContain("Hello World");
  });

  test("should handle execution failure of a permitted command", async () => {
    // Use a command that will fail
    const result = await execute({ command: "nonexistentcommand", agentConfig: mockAgentConfig });
    expect(result).toContain("EXECUTION FAILED:");
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
    
    const result = await execute({ command: "echo 'test'", agentConfig: restrictiveAgentConfig });
    expect(result).toContain("test");
  });
});