import { mock, describe, test, expect, beforeEach, afterEach } from 'bun:test';
import path from 'path';
import os from 'os';

// Mock modules at the top using the ESM-compatible API
mock.module('child_process', () => ({
  spawn: mock(),
  exec: mock(),
}));

mock.module('fs-extra', () => ({
  default: {
    ensureDir: mock(),
    readJson: mock(),
    pathExists: mock(),
    writeJson: mock(),
    writeFile: mock(),
    remove: mock(),
    copy: mock(),
    readdir: mock(),
  },
}));

// Mock fetch globally for this test file
global.fetch = mock();

// TODO: This test suite is skipped because it involves complex process spawning and
// file system interactions that are difficult to reliably mock in the current Jest ESM setup.
// The underlying issue seems to be with how `child_process.exec` runs validation scripts
// in a separate node environment, which is outside the direct control of the Jest test runner.
// This requires a more in-depth fix, potentially involving refactoring the benchmark runner
// to not rely on executing external scripts.
// Additionally, Bun's test runner does not yet support fake timers.
describe.skip('Benchmark Runner Integration', () => {
  let BenchmarkRunner;
  let fs;
  let spawn;
  let exec;
  let runner;
  let testBenchmarkFile;
  let testDir;
  let mockChildProcess;
  let testBenchmark;

  beforeEach(async () => {
    // Import modules after mocks are set up
    BenchmarkRunner = (await import('../../../evaluation/runners/benchmark_runner.js')).default;
    fs = (await import('fs-extra')).default;
    const cp = await import('child_process');
    spawn = cp.spawn;
    exec = cp.exec;

    // Reset mocks
    mock.clearAllMocks();

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

    // Universal mocks
    mockChildProcess = {
      stdout: { on: mock() },
      stderr: { on: mock() },
      on: mock((event, callback) => {
        if (event === 'close') {
          // Defer the close event to simulate async process exit
          setTimeout(() => callback(0), 1);
        }
      }),
      pid: 1234,
    };
    spawn.mockReturnValue(mockChildProcess);
    process.kill = mock(); // Mock process.kill
    global.fetch.mockResolvedValue({ ok: true, json: async () => ({}) });
    fs.ensureDir.mockResolvedValue(true);
  });

  afterEach(() => {
  });

  test('should run a problem successfully', async () => {
    // Mocks specific to this test
    fs.readJson.mockResolvedValue(testBenchmark);
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    exec.mockImplementation((command, options, callback) => {
      callback(null, { stdout: JSON.stringify({ success: true }), stderr: '' });
    });

    fs.pathExists.mockResolvedValue(true);
    fs.readJson
      .mockResolvedValueOnce({ project_status: 'IN_PROGRESS' })
      .mockResolvedValue({ project_status: 'COMPLETED' });

    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    // Execution
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    // await jest.advanceTimersByTimeAsync(15000);
    const result = await runPromise;

    // Assertions
    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(exec).toHaveBeenCalledWith(expect.stringContaining('validate_factorial.js'), expect.any(Object), expect.any(Function));
  }, 70000);

  test('should handle benchmark timeout', async () => {
    // Mocks
    fs.readJson.mockResolvedValue(testBenchmark);
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();
    runner.benchmark.execution.timeout = 100;

    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'IN_PROGRESS' });

    // Execution
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    // await jest.advanceTimersByTimeAsync(5000);
    const result = await runPromise;

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('Benchmark timed out.');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });

  test('should handle task failure status', async () => {
    // Mocks
    fs.readJson.mockResolvedValue(testBenchmark);
    runner = new BenchmarkRunner(testBenchmarkFile);
    await runner.loadBenchmark();

    mockChildProcess.stdout.on.mockImplementation((event, cb) => {
      if (event === 'data') cb('Stigmergy Engine API server is running');
    });

    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue({ project_status: 'HUMAN_INPUT_NEEDED' });

    // Execution
    const problem = runner.benchmark.problems[0];
    const problemDir = path.join(testDir, 'problems');
    const runPromise = runner.runProblem(problem, problemDir);

    // await jest.advanceTimersByTimeAsync(5000);
    const result = await runPromise;

    // Assertions
    expect(result.success).toBe(false);
    expect(result.error).toBe('Task failed with status: HUMAN_INPUT_NEEDED');
    expect(process.kill).toHaveBeenCalledWith(-1234);
  });
});
