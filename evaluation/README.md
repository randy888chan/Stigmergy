# Stigmergy Benchmark Suite

## Overview

This directory contains the Stigmergy benchmark suite, which is designed to evaluate the performance and capabilities of the Stigmergy autonomous development system. The benchmark suite includes a variety of problems ranging from simple file creation tasks to complex full-stack applications.

## Directory Structure

```
evaluation/
├── benchmark.json          # Benchmark configuration file
├── problems/               # Problem-specific directories
├── runners/                # Benchmark execution scripts
└── validators/             # Problem validation scripts
```

## Benchmark Problems

The benchmark suite includes the following problems:

1. **Simple File Creation Task**: Create a JavaScript file that exports a factorial function
2. **API Endpoint Implementation**: Implement a REST API endpoint using Express.js
3. **React Component Development**: Create React components with search functionality
4. **Database Integration Task**: Implement database integration using Mongoose or Sequelize
5. **Testing Implementation**: Add unit tests for an existing JavaScript module
6. **Full Stack CRUD API**: Create a complete CRUD API for a 'notes' resource

## Running Benchmarks

To run the benchmark suite:

```bash
# Run the full benchmark suite
npm run test:benchmark

# Run with custom benchmark file and output location
node runners/benchmark_runner.js ../benchmark.json results.json
```

## Benchmark Configuration

The [benchmark.json](benchmark.json) file contains the configuration for the benchmark suite, including:

- Benchmark metadata (name, version, description)
- List of problems with their descriptions and validation criteria
- Execution configuration (timeout, max retries, environment requirements)

## Validation Scripts

Each problem has a corresponding validation script in the [validators/](validators/) directory that verifies the correctness of the generated solution. These scripts check for:

- Required files
- Functional correctness
- Code quality
- Performance criteria

## Results

The benchmark runner generates detailed results including:

- Pass/fail status for each problem
- Execution time
- Detailed diagnostics for troubleshooting
- Performance metrics and resource usage

## Adding New Benchmarks

To add a new benchmark problem:

1. Add the problem definition to [benchmark.json](benchmark.json)
2. Create a validation script in the [validators/](validators/) directory
3. Test the benchmark problem with the runner

## Performance Monitoring

The benchmark system includes performance monitoring capabilities that track:

- System resource usage (CPU, memory)
- Execution time for each problem
- Memory allocation and garbage collection
- Network and I/O operations

This information is used to optimize the Stigmergy system and identify performance bottlenecks.