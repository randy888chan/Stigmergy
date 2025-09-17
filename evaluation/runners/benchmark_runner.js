import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execPromise = promisify(exec);

class BenchmarkRunner {
  constructor(benchmarkFile) {
    this.benchmarkFile = benchmarkFile;
    this.results = [];
  }

  async loadBenchmark() {
    try {
      const benchmarkData = await fs.readJson(this.benchmarkFile);
      this.benchmark = benchmarkData.benchmark;
      console.log(chalk.green(`Loaded benchmark: ${this.benchmark.name} v${this.benchmark.version}`));
      return this.benchmark;
    } catch (error) {
      throw new Error(`Failed to load benchmark file: ${error.message}`);
    }
  }

  async runProblem(problem, problemDir) {
    console.log(chalk.blue(`Running problem: ${problem.title}`));
    
    const startTime = Date.now();
    let success = false;
    let error = null;
    let output = '';
    
    try {
      // Create a temporary directory for this problem
      const tempDir = path.join(problemDir, `temp_${problem.id}`);
      await fs.ensureDir(tempDir);
      
      // Initialize Stigmergy in the temp directory
      await execPromise(`npx stigmergy init`, { cwd: tempDir });
      
      // Change to the temp directory
      const originalCwd = process.cwd();
      process.chdir(tempDir);
      
      try {
        // Run the Stigmergy system to solve the problem
        // For the new standalone architecture, we'll use the chat API
        const chatRequest = {
          agentId: 'system',
          prompt: problem.description
        };
        
        // Try to communicate with the Stigmergy service
        try {
          const response = await fetch('http://localhost:3010/api/chat', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(chatRequest),
            timeout: this.benchmark.execution.timeout
          });
          
          if (response.ok) {
            const result = await response.json();
            output = JSON.stringify(result, null, 2);
          } else {
            output = `HTTP Error: ${response.status} ${response.statusText}`;
          }
        } catch (fetchError) {
          // If we can't connect to the service, try running the engine directly
          console.log(chalk.yellow('Could not connect to Stigmergy service, running engine directly...'));
          const { stdout, stderr } = await execPromise(
            `node ${path.join(originalCwd, 'engine/server.js')} --task "${problem.description}"`,
            { timeout: this.benchmark.execution.timeout }
          );
          output = stdout + stderr;
        }
        
        // Check success criteria
        success = await this.validateSolution(problem, tempDir);
      } finally {
        // Change back to original directory
        process.chdir(originalCwd);
        
        // Clean up temp directory
        await fs.remove(tempDir);
      }
    } catch (err) {
      error = err.message;
      console.error(chalk.red(`Error running problem ${problem.id}: ${error}`));
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    const result = {
      problemId: problem.id,
      title: problem.title,
      success,
      duration,
      error,
      output
    };
    
    this.results.push(result);
    return result;
  }

  async validateSolution(problem, solutionDir) {
    console.log(chalk.yellow(`Validating solution for: ${problem.title}`));
    
    try {
      // Check if expected files exist
      for (const expectedFile of problem.expected_files) {
        const filePath = path.join(solutionDir, expectedFile);
        if (!(await fs.pathExists(filePath))) {
          console.error(chalk.red(`Missing expected file: ${expectedFile}`));
          return false;
        }
      }
      
      // Check success criteria (simplified validation)
      for (const criterion of problem.success_criteria) {
        // In a real implementation, we would have more sophisticated validation
        console.log(chalk.gray(`Checking criterion: ${criterion}`));
        
        // For specific criteria, we can implement more detailed checks
        if (criterion.includes('function named')) {
          // Extract function name from criterion
          const match = criterion.match(/function named ['"](.+?)['"]/);
          if (match) {
            const functionName = match[1];
            // Check if the function exists in the expected files
            let functionFound = false;
            for (const expectedFile of problem.expected_files) {
              const filePath = path.join(solutionDir, expectedFile);
              if (await fs.pathExists(filePath)) {
                const content = await fs.readFile(filePath, 'utf8');
                if (content.includes(functionName)) {
                  functionFound = true;
                  break;
                }
              }
            }
            if (!functionFound) {
              console.error(chalk.red(`Function '${functionName}' not found in expected files`));
              return false;
            }
          }
        }
      }
      
      console.log(chalk.green(`Solution validation passed for: ${problem.title}`));
      return true;
    } catch (error) {
      console.error(chalk.red(`Validation error: ${error.message}`));
      return false;
    }
  }

  async runAll() {
    if (!this.benchmark) {
      await this.loadBenchmark();
    }
    
    const problemDir = path.join(path.dirname(this.benchmarkFile), 'problems');
    await fs.ensureDir(problemDir);
    
    console.log(chalk.blue(`Running ${this.benchmark.problems.length} benchmark problems...`));
    
    for (const problem of this.benchmark.problems) {
      try {
        const result = await this.runProblem(problem, problemDir);
        this.printResult(result);
      } catch (error) {
        console.error(chalk.red(`Failed to run problem ${problem.id}: ${error.message}`));
        this.results.push({
          problemId: problem.id,
          title: problem.title,
          success: false,
          duration: 0,
          error: error.message,
          output: ''
        });
      }
    }
    
    this.printSummary();
    return this.results;
  }

  printResult(result) {
    const status = result.success ? chalk.green('PASS') : chalk.red('FAIL');
    console.log(`${status} ${result.title} (${result.duration}ms)`);
    
    if (result.error) {
      console.log(chalk.red(`  Error: ${result.error}`));
    }
    
    if (result.output) {
      console.log(chalk.gray(`  Output: ${result.output.substring(0, 100)}...`));
    }
  }

  printSummary() {
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const total = this.results.length;
    
    console.log('\n' + chalk.blue.bold('=== BENCHMARK RESULTS SUMMARY ==='));
    console.log(chalk.green(`Passed: ${passed}`));
    console.log(chalk.red(`Failed: ${failed}`));
    console.log(chalk.blue(`Total: ${total}`));
    console.log(chalk.blue(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`));
    
    const totalTime = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(chalk.blue(`Total Time: ${totalTime}ms`));
    console.log(chalk.blue.bold('================================'));
  }

  async saveResults(outputFile) {
    const resultsData = {
      benchmark: this.benchmark.name,
      version: this.benchmark.version,
      timestamp: new Date().toISOString(),
      results: this.results
    };
    
    await fs.writeJson(outputFile, resultsData, { spaces: 2 });
    console.log(chalk.green(`Results saved to: ${outputFile}`));
  }
}

// CLI interface
async function main() {
  const benchmarkFile = process.argv[2] || path.join(process.cwd(), 'evaluation', 'benchmark.json');
  const outputFile = process.argv[3] || path.join(process.cwd(), 'evaluation', 'results.json');
  
  try {
    const runner = new BenchmarkRunner(benchmarkFile);
    await runner.runAll();
    await runner.saveResults(outputFile);
  } catch (error) {
    console.error(chalk.red(`Benchmark runner failed: ${error.message}`));
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main();
}

export default BenchmarkRunner;