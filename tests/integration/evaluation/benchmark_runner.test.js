// tests/integration/evaluation/benchmark_runner.test.js

import { jest } from '@jest/globals';

// Mock modules at the top
jest.mock('child_process');
jest.mock('fs-extra');

import BenchmarkRunner from '../../../evaluation/runners/benchmark_runner.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';

// Use fake timers for the whole suite
jest.useFakeTimers();

global.fetch = jest.fn();

describe('Benchmark Runner Integration', () => {
  let runner;
  let testBenchmarkFile;
  let testDir;
  let mockChildProcess;
  let testBenchmark;

  // beforeEach should only contain simple, universal setup
  beforeEach(() => {
    jest.clearAllMocks();

    testDir = path.join(os.tmpdir(), `stigmergy-test-${Date.now()}`);
    testBenchmarkFile = path.join(testDir, 'test_benchmark.json');

    testBenchmark = {
      benchmark: {
        name: "Test Benchmark",
        version: "1.0.0",
        problems: [{ id: "test-1", title: "Test Problem", validation_script: 'validate_factorial.js' }],
        execution: { timeout: 20000 }
      }
    };

    // Universal mocks that all tests need
    mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => event === 'close' && setTimeout(() => callback(0), 1)),
      pid: 1234,
    };
    spawn.mockReturnValue(mockChildProcess);
    process.kill = jest.fn();
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });

    // Mock fs.ensureDir because almost every test needs to create a directory
    fs.ensureDir.mockResolvedValue(true);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should run a problem successfully', async () => {
    // --- Mocks specific to THIS test ---
    fs.readJson.mockResolvedValue(testBenchmark); // For loadBenchmark
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    // Mock the validation script execution
    exec.mockImplementation((command, options, callback) => {
      if (command.includes('validate_factorial.js')) {
        callback(null, { stdout: JSON.stringify({ success: true }), stderr: '' });
      } else {
        callback(null, { stdout: '', stderr: '' });
      }
    });

    // Mock the file system lifecycle for polling
    fs.pathExists.mockResolvedValue(true);
    fs.readJson
      .mockResolvedValueOnce({ project_status: 'IN_PROGRESS' }) // First poll
      .mockResolvedValue({ project_status: 'COMPLETED' });      // Subsequent polls

    // Mock the engine startup message
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    // --- Execution ---
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    await jest.advanceTimersByTimeAsync(15000); // Simulate polling time
    const result = await runPromise;

    // --- Assertions ---
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(exec).toHaveBeenCalledWith(expect.stringContaining('validate_factorial.js'), expect.any(Object), expect.any(Function));
  }, 70000);

  test('should handle benchmark timeout', async () => {
    // --- Mocks specific to THIS test ---
    fs.readJson.mockResolvedValue(testBenchmark); // For loadBenchmark
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();
    runner.benchmark.execution.timeout = 100; // Set a very short timeout

    // Mock the engine startup message
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    // Mock the file system to ALWAYS be in progress
    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'IN_PROGRESS' });

    // --- Execution ---
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    await jest.advanceTimersByTimeAsync(5000); // Advance time past the short timeout
    const result = await runPromise;

    // --- Assertions ---
    expect(result.success).toBe(false);
    expect(result.error).toBe('Benchmark timed out.');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });

  test('should handle task failure status', async () => {
    // --- Mocks specific to THIS test ---
    fs.readJson.mockResolvedValue(testBenchmark); // For loadBenchmark
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    // Mock the engine startup message
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    // Mock the file system to return a failure state
    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'HUMAN_INPUT_NEEDED' });

    // --- Execution ---
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    await jest.advanceTimersByTimeAsync(5000);
    const result = await runPromise;

    // --- Assertions ---
    expect(result.success).toBe(false);
    expect(result.error).toBe('Task failed with status: HUMAN_INPUT_NEEDED');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });
});