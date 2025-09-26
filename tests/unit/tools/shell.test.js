import { mock, describe, test, expect, beforeEach } from 'bun:test';

// Mock the dependencies before importing the module under test
const mockExecPromise = mock();
mock.module('child_process', () => ({
  execPromise: mockExecPromise,
}));

// Import the shell tool module after mocking dependencies
import { execute } from '../../../tools/shell.js';

describe('Shell Tool', () => {
  beforeEach(() => {
    mock.restore();
  });

  test('should execute shell commands and return output', async () => {
    mockExecPromise.mockResolvedValue({ stdout: "mocked output", stderr: "" });
    
    const result = await execute({ 
      command: 'echo "hello world"',
      agentConfig: { permitted_shell_commands: ["echo *"] }
    });
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
  });
  
  test('should handle command errors gracefully', async () => {
    mockExecPromise.mockRejectedValue(new Error('Command failed'));
    
    const result = await execute({ 
      command: 'invalid command',
      agentConfig: { permitted_shell_commands: ["*"] }
    });
    
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    expect(result).toContain('EXECUTION FAILED');
  });
});