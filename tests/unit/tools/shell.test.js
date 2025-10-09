import { mock, describe, test, expect, beforeEach } from 'bun:test';
import { promisify } from 'util';

// Mock the exec function from child_process
const mockExec = mock((command, options, callback) => {
  // Default mock implementation
  callback(null, { stdout: 'default stdout', stderr: '' });
});

mock.module('child_process', () => ({
  exec: mockExec,
}));

// Re-import the module under test AFTER the mock is defined to ensure it gets the mocked dependency.
const { execute } = await import('../../../tools/shell.js');

describe('Shell Tool', () => {

  beforeEach(() => {
    mockExec.mockClear();
  });

  test('should execute shell commands and return stdout', async () => {
    // Arrange: Setup the mock to simulate a successful execution.
    // The callback's second argument must be an object { stdout, stderr } for promisify(exec) to work correctly.
    mockExec.mockImplementation((command, options, callback) => {
      callback(null, { stdout: 'mocked output', stderr: '' });
    });

    // Act
    const result = await execute({ command: 'echo "hello world"', cwd: '/test' });

    // Assert
    expect(result).toBe('mocked output');
    const call = mockExec.mock.calls[0];
    expect(call[0]).toBe('echo "hello world"');
    expect(call[1]).toEqual({ timeout: 5000, cwd: '/test' });
  });

  test('should handle command errors gracefully', async () => {
    // Arrange: Setup the mock to simulate an error.
    const mockError = new Error('Command failed');
    mockError.stderr = 'Error details';
    mockExec.mockImplementation((command, options, callback) => {
      // The first argument (error) being non-null causes promisify to reject.
      callback(mockError, { stdout: '', stderr: 'Error details' });
    });

    // Act
    const result = await execute({ command: 'invalid command', cwd: '/test' });

    // Assert
    expect(result).toContain('EXECUTION FAILED: Error details');
    const call = mockExec.mock.calls[0];
    expect(call[0]).toBe('invalid command');
    expect(call[1]).toEqual({ timeout: 5000, cwd: '/test' });
  });

  test('should return stderr even on successful exit', async () => {
    // Arrange: Mock exec to return a non-empty stderr with no error object.
     mockExec.mockImplementation((command, options, callback) => {
      callback(null, { stdout: 'main output', stderr: 'warning message' });
    });

    // Act
    const result = await execute({ command: 'some command', cwd: '/test' });

    // Assert
    expect(result).toBe('EXECUTION FINISHED WITH STDERR: warning message');
  });
});