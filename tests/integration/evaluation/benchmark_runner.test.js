import BenchmarkRunner from '../../../evaluation/runners/benchmark_runner.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { spawn, exec } from 'child_process';
import { jest } from '@jest/globals';

global.fetch = jest.fn();

jest.mock('child_process', () => ({
  ...jest.requireActual('child_process'),
  spawn: jest.fn(),
  exec: jest.fn((command, options, callback) => callback(null, { stdout: '', stderr: '' })),
}));

jest.mock('fs-extra');

describe('Benchmark Runner Integration', () => {
  let runner;
  let testBenchmarkFile;
  let testResultsFile;
  let testDir;
  let mockChildProcess;

  beforeEach(async () => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    testDir = path.join(os.tmpdir(), `stigmergy-test-${Date.now()}`);
    global.StigmergyConfig = { core_path: testDir };
    
    testBenchmarkFile = path.join(testDir, 'test_benchmark.json');
    testResultsFile = path.join(testDir, 'test_results.json');
    
    const testBenchmark = {
      benchmark: {
        name: "Test Benchmark",
        version: "1.0.0",
        description: "Test benchmark for integration testing",
        problems: [
          {
            id: "test-1",
            title: "Test Problem",
            description: "A simple test problem",
            expected_files: ["test.js"],
            validation_script: 'validate_factorial.js',
            difficulty: "easy"
          }
        ],
        execution: {
          timeout: 10000,
          max_retries: 1
        }
      }
    };
    
    fs.writeJson.mockResolvedValue();
    await fs.writeJson(testBenchmarkFile, testBenchmark);

    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    mockChildProcess = {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() },
      pid: 1234,
    };
    spawn.mockReturnValue(mockChildProcess);
    process.kill = jest.fn();

    fs.ensureDir.mockResolvedValue();
    fs.remove.mockResolvedValue();
    fs.copy.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
  });

  afterEach(async () => {
    await fs.remove(testBenchmarkFile);
    await fs.remove(testResultsFile);
  });

  test('should run a problem successfully', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    fs.pathExists
      .mockResolvedValueOnce(true) // stigmergy init check
      .mockResolvedValueOnce(false) // First poll, state file doesn't exist
      .mockResolvedValue(true);   // Subsequent polls, state file exists

    fs.readJson.mockResolvedValue({
      project_status: 'EXECUTION_COMPLETE',
    });
    
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const result = await runner.runProblem(problem, problemDir);

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(spawn).toHaveBeenCalledWith('node', [expect.stringContaining('engine/server.js')], expect.any(Object));
    expect(fetch).toHaveBeenCalledWith('http://localhost:3010/api/chat', expect.any(Object));
    expect(fs.pathExists).toHaveBeenCalledWith(expect.stringContaining('.stigmergy/state/current.json'));
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });

  test('should handle benchmark timeout', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    // Simulate state never reaching completion
    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'IN_PROGRESS' });
    
    runner.benchmark.execution.timeout = 100; // Set a very short timeout
    
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const result = await runner.runProblem(problem, problemDir);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Benchmark timed out.');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });

  test('should handle task failure status', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ message: 'Success' }),
    });

    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'HUMAN_INPUT_NEEDED' });
    
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');

    const result = await runner.runProblem(problem, problemDir);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Task failed with status: HUMAN_INPUT_NEEDED');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });
});