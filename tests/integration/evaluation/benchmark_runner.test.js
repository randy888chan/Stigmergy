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
  jest.setTimeout(60000);
  let runner;
  let testBenchmarkFile;
  let testDir;
  let mockChildProcess;
  let testBenchmark;

  beforeEach(async () => {
    jest.clearAllMocks();

    testDir = path.join(os.tmpdir(), `stigmergy-test-${Date.now()}`);
    global.StigmergyConfig = { core_path: testDir };
    
    testBenchmarkFile = path.join(testDir, 'test_benchmark.json');
    
    testBenchmark = {
      benchmark: {
        name: "Test Benchmark",
        version: "1.0.0",
        description: "Test benchmark for integration testing",
        problems: [{ id: "test-1", title: "Test Problem", description: "A simple test problem", expected_files: ["test.js"], validation_script: 'validate_factorial.js', difficulty: "easy" }],
        execution: { timeout: 20000, max_retries: 1 }
      }
    };
    
    // Mock fs.readJson to return the benchmark object for the loadBenchmark call
    fs.readJson.mockResolvedValue(testBenchmark);
    fs.writeJson.mockResolvedValue(); // Mock writeJson as it's called in the runner

    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    // Setup mocks for spawn and process.kill
    mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 1); // Defer close event
        }
      }),
      pid: 1234,
    };
    spawn.mockReturnValue(mockChildProcess);
    process.kill = jest.fn();

    // Default mock for fetch
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });
    fs.readdir.mockResolvedValue([]);
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });

  test('should run a problem successfully', async () => {
    // 1. Mock the exec call for the validation script
    exec.mockImplementation((command, options, callback) => {
      if (command.includes('validate_factorial.js')) {
        const mockValidatorOutput = JSON.stringify({ success: true, message: 'Validation successful.' });
        callback(null, { stdout: mockValidatorOutput, stderr: '' });
      } else {
        callback(null, { stdout: '', stderr: '' });
      }
    });

    // 2. Mock the readJson lifecycle
    fs.readJson
      .mockResolvedValueOnce(testBenchmark)
      .mockResolvedValueOnce({ project_status: 'IN_PROGRESS' })
      .mockResolvedValue({ project_status: 'COMPLETED' });

    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();
    
    // 3. Mock the spawned process stdout
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') {
        cb('Stigmergy Engine API server is running on http://localhost:3010');
      }
    });

    // 4. Mock the pathExists lifecycle
    fs.pathExists
      .mockResolvedValueOnce(true)
      .mockResolvedValueOnce(false)
      .mockResolvedValue(true);

    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const runPromise = runner.runProblem(problem, problemDir);
    await jest.advanceTimersByTimeAsync(15000);
    const result = await runPromise;

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
  });

  test('should handle benchmark timeout', async () => {
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') {
        cb('Stigmergy Engine API server is running on http://localhost:3010');
      }
    });

    // Simulate state never reaching completion
    fs.pathExists.mockResolvedValue(true);
    fs.readJson
      .mockResolvedValueOnce(testBenchmark)
      .mockResolvedValue({ project_status: 'IN_PROGRESS' });
    
    runner.benchmark.execution.timeout = 100; // Set a very short timeout
    
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const runPromise = runner.runProblem(problem, problemDir);
    await jest.advanceTimersByTimeAsync(5000);
    const result = await runPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe('Benchmark timed out.');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });

  test('should handle task failure status', async () => {
    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') {
        cb('Stigmergy Engine API server is running on http://localhost:3010');
      }
    });

    fs.pathExists.mockResolvedValue(true);
    fs.readJson
      .mockResolvedValueOnce(testBenchmark)
      .mockResolvedValue({ project_status: 'HUMAN_INPUT_NEEDED' });
    
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const runPromise = runner.runProblem(problem, problemDir);
    await jest.advanceTimersByTimeAsync(5000);
    const result = await runPromise;

    expect(result.success).toBe(false);
    expect(result.error).toBe('Task failed with status: HUMAN_INPUT_NEEDED');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });
});