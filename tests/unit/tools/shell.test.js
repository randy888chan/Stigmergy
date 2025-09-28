import { mock, describe, test, expect } from 'bun:test';
import { execute } from '../../../tools/shell.js';

describe('Shell Tool', () => {
  test('should execute shell commands and return output', async () => {
    // Create a mock for the execPromise function
    const mockExecPromise = mock(async () => ({ stdout: "mocked output", stderr: "" }));

    const result = await execute({
      command: 'echo "hello world"',
      agentConfig: { permitted_shell_commands: ["echo *"] },
      // Inject the mock directly
      execPromise: mockExecPromise
    });

    expect(result).toBeDefined();
    expect(result).toBe('mocked output');
    expect(mockExecPromise).toHaveBeenCalledWith('echo "hello world"', { timeout: 5000 });
  });

  test('should handle command errors gracefully', async () => {
    // Create a mock that rejects
    const mockExecPromise = mock(async () => { throw new Error('Command failed') });

    const result = await execute({
      command: 'invalid command',
      agentConfig: { permitted_shell_commands: ["*"] },
      // Inject the mock directly
      execPromise: mockExecPromise
    });

    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('EXECUTION FAILED: Command failed');
    expect(mockExecPromise).toHaveBeenCalledWith('invalid command', { timeout: 5000 });
  });
});