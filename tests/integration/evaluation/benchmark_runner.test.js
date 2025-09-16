import BenchmarkRunner from '../../../evaluation/runners/benchmark_runner.js';
import fs from 'fs-extra';
import path from 'path';

describe('Benchmark Runner Integration', () => {
  let runner;
  let testBenchmarkFile;
  let testResultsFile;
  let testDir;

  beforeAll(async () => {
    // Create a temporary directory for testing
    testDir = path.join(process.cwd(), 'temp-test-benchmark');
    await fs.ensureDir(testDir);
    
    // Create a test benchmark file
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
            success_criteria: [
              "The file test.js should exist"
            ],
            difficulty: "easy"
          }
        ],
        execution: {
          timeout: 5000,
          max_retries: 1
        }
      }
    };
    
    await fs.writeJson(testBenchmarkFile, testBenchmark);
  });

  afterAll(async () => {
    // Clean up test files
    if (await fs.pathExists(testDir)) {
      await fs.remove(testDir);
    }
  });

  beforeEach(() => {
    runner = new BenchmarkRunner(testBenchmarkFile);
  });

  test('should load benchmark file correctly', async () => {
    const benchmark = await runner.loadBenchmark();
    
    expect(benchmark).toBeDefined();
    expect(benchmark.name).toBe('Test Benchmark');
    expect(benchmark.version).toBe('1.0.0');
    expect(benchmark.problems).toHaveLength(1);
  });

  test('should validate solution with expected files', async () => {
    // Create a temporary directory with expected file
    const tempDir = path.join(testDir, 'temp_test');
    await fs.ensureDir(tempDir);
    
    // Create the expected file
    const expectedFile = path.join(tempDir, 'test.js');
    await fs.writeFile(expectedFile, 'console.log("test");');
    
    // Load the benchmark
    await runner.loadBenchmark();
    
    // Validate the solution
    const isValid = await runner.validateSolution(runner.benchmark.problems[0], tempDir);
    
    expect(isValid).toBe(true);
    
    // Clean up
    await fs.remove(tempDir);
  });

  test('should fail validation when expected files are missing', async () => {
    // Create a temporary directory without expected file
    const tempDir = path.join(testDir, 'temp_test_missing');
    await fs.ensureDir(tempDir);
    
    // Load the benchmark
    await runner.loadBenchmark();
    
    // Validate the solution
    const isValid = await runner.validateSolution(runner.benchmark.problems[0], tempDir);
    
    expect(isValid).toBe(false);
    
    // Clean up
    await fs.remove(tempDir);
  });

  test('should save results to file', async () => {
    // Load the benchmark
    await runner.loadBenchmark();
    
    // Add a mock result
    runner.results = [{
      problemId: "test-1",
      title: "Test Problem",
      success: true,
      duration: 100,
      error: null,
      output: "test output"
    }];
    
    // Save results
    await runner.saveResults(testResultsFile);
    
    // Check that file was created
    expect(await fs.pathExists(testResultsFile)).toBe(true);
    
    // Check file content
    const savedResults = await fs.readJson(testResultsFile);
    expect(savedResults.benchmark).toBe('Test Benchmark');
    expect(savedResults.version).toBe('1.0.0');
    expect(savedResults.results).toHaveLength(1);
    expect(savedResults.results[0].problemId).toBe('test-1');
  });

  test('should print results summary', async () => {
    // Mock console.log to capture output
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    
    // Add mock results
    runner.results = [
      {
        problemId: "test-1",
        title: "Test Problem 1",
        success: true,
        duration: 100,
        error: null,
        output: "test output"
      },
      {
        problemId: "test-2",
        title: "Test Problem 2",
        success: false,
        duration: 150,
        error: "Test error",
        output: ""
      }
    ];
    
    // Print summary
    runner.printSummary();
    
    // Check that console.log was called
    expect(consoleLogSpy).toHaveBeenCalled();
    
    // Restore console.log
    consoleLogSpy.mockRestore();
  });
});