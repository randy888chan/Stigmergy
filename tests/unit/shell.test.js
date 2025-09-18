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

  test('should throw a security policy violation for a non-permitted command', async () => {
    const command = 'ls -l';
    // We need to wrap the async call in a function for rejects.toThrow to catch the promise rejection.
    await expect(async () => await execute({ command, agentConfig: mockAgentConfig })).rejects.toThrow(
      `Security policy violation: Command "${command}" not permitted for @${mockAgentConfig.alias}.`
    );
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