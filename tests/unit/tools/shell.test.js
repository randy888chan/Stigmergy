import { exec } from "child_process";
import { execute } from "../../../tools/shell.js";

// Mock dependencies
jest.mock("child_process", () => ({
  exec: jest.fn(),
}));

describe("Shell Tool", () => {
  const mockAgentConfig = {
    alias: "test-agent",
    permitted_shell_commands: ["ls -l", "echo *"],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should execute a permitted command successfully", async () => {
    exec.mockImplementation((command, options, callback) =>
      callback(null, { stdout: "files", stderr: "" })
    );
    const result = await execute({ command: "ls -l", agentConfig: mockAgentConfig });
    expect(exec).toHaveBeenCalledWith("ls -l", expect.any(Object), expect.any(Function));
    expect(result).toContain("STDOUT:\nfiles");
  });

  test("should handle execution failure of a permitted command", async () => {
    exec.mockImplementation((command, options, callback) =>
      callback(new Error("Command failed"), null)
    );
    const result = await execute({ command: "ls -l", agentConfig: mockAgentConfig });
    expect(result).toContain("EXECUTION FAILED: Command failed");
  });

  test("should throw an error for a non-permitted command", async () => {
    await expect(
      execute({ command: "rm -rf /", agentConfig: mockAgentConfig })
    ).rejects.toThrow('Security policy violation: Command "rm -rf /" not permitted');
  });

  test("should throw an error if no command is provided", async () => {
    await expect(execute({ command: "", agentConfig: mockAgentConfig })).rejects.toThrow(
      "No command provided."
    );
  });

  test("should allow wildcard commands if permitted", async () => {
    exec.mockImplementation((command, options, callback) =>
      callback(null, { stdout: "hello", stderr: "" })
    );
    const result = await execute({ command: "echo 'hello'", agentConfig: mockAgentConfig });
    expect(exec).toHaveBeenCalled();
    expect(result).toContain("STDOUT:\nhello");
  });
});
