import { execute } from '../../tools/shell.js';

describe('Secure Shell Execution Tool', () => {
  const mockAgentConfig = {
    alias: 'test-agent',
    permitted_shell_commands: ['echo *'],
  };

  test('should execute a permitted command and return the output', async () => {
    const command = 'echo "Hello, world!"';
    const result = await execute({ command, agentConfig: mockAgentConfig });
    expect(result.trim()).toBe('Hello, world!');
  });

  test('should return an error string for a non-permitted command', async () => {
    const command = 'ls -l';
    const result = await execute({ command, agentConfig: mockAgentConfig });
    expect(result).toContain('EXECUTION FAILED: Security policy violation');
  });

  test('should return an error message for a command that fails during execution', async () => {
    // This command is permitted by the wildcard, but will fail to execute because the command doest exist.
    const command = 'echo_this_will_fail';
    const mockConfigWithBadCommand = {
        ...mockAgentConfig,
        permitted_shell_commands: ['echo_this_will_fail']
    }
    const result = await execute({ command, agentConfig: mockConfigWithBadCommand });
    expect(result).toContain('EXECUTION FAILED');
  });

  test('should handle commands with no output', async () => {
    const command = 'echo ""';
    const result = await execute({ command, agentConfig: mockAgentConfig });
    expect(result.trim()).toBe('');
  });
});