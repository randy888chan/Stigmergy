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
    const result = await execute({ command: "console.log('Hello World'); 2 + 2", agentConfig: mockAgentConfig });
    expect(result).toContain("OUTPUT:\nHello World");
    expect(result).toContain("RESULT:\n4");
  });

  test("should handle execution failure of a permitted command", async () => {
    const result = await execute({ command: "nonExistentFunction()", agentConfig: mockAgentConfig });
    expect(result).toContain("EXECUTION FAILED:");
  });

  test("should throw an error for a non-permitted command", async () => {
    const restrictiveAgentConfig = {
      alias: "test-agent",
      permitted_shell_commands: ["console\\.log.*"], // Only allow console.log
    };
    
    await expect(
      execute({ command: "process.exit()", agentConfig: restrictiveAgentConfig })
    ).rejects.toThrow('Security policy violation: Command "process.exit()" not permitted');
  });

  test("should throw an error if no command is provided", async () => {
    await expect(execute({ command: "", agentConfig: mockAgentConfig })).rejects.toThrow(
      "No command provided."
    );
  });

  test("should allow specific commands if permitted", async () => {
    const restrictiveAgentConfig = {
      alias: "test-agent",
      permitted_shell_commands: ["Math\\..*"], // Allow Math functions
    };
    
    const result = await execute({ command: "Math.max(5, 10)", agentConfig: restrictiveAgentConfig });
    expect(result).toContain("RESULT:\n10");
  });
});