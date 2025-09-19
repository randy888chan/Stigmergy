import fs from 'fs-extra';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execPromise = promisify(exec);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
    console.log(chalk.blue(`[Benchmark] Running problem: ${problem.title}`));
    
    const startTime = Date.now();
    let success = false;
    let error = null;
    let output = '';
    
    const tempDir = path.join(problemDir, `temp_${problem.id}`);
    let engineProcess;

    try {
      console.log(`[Benchmark] Creating temp directory: ${tempDir}`);
      await fs.ensureDir(tempDir);

      console.log('[Benchmark] Initializing Stigmergy...');
      await execPromise(`npx stigmergy init`, { cwd: tempDir });
      console.log('[Benchmark] Stigmergy initialized.');

      const enginePath = path.join(process.cwd(), 'engine', 'server.js');
      console.log(`[Benchmark] Spawning engine process: ${enginePath}`);
      engineProcess = spawn('node', [enginePath], { cwd: tempDir, detached: true });

      engineProcess.stdout.on('data', (data) => console.log(chalk.gray(`[Engine STDOUT]: ${data}`)));
      engineProcess.stderr.on('data', (data) => console.error(chalk.red(`[Engine STDERR]: ${data}`)));
      
      console.log('[Benchmark] Waiting for engine to start...');
      await sleep(10000); // Increased wait time for engine to start
      console.log('[Benchmark] Engine should be started. Sending request.');

      const chatRequest = {
        agentId: 'system',
        prompt: problem.description
      };

      const response = await fetch('http://localhost:3010/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatRequest),
      });
      console.log(`[Benchmark] Initial request sent. Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      output = JSON.stringify(await response.json(), null, 2);

      // Monitor for completion
      console.log('[Benchmark] Starting to monitor for completion...');
      const stateFilePath = path.join(tempDir, '.stigmergy', 'state', 'current.json');
      let taskCompleted = false;
      const timeout = Date.now() + (this.benchmark.execution.timeout || 120000);

      while (Date.now() < timeout) {
        if (await fs.pathExists(stateFilePath)) {
          const state = await fs.readJson(stateFilePath);
          console.log(`[Benchmark] Polling... Current status: ${state.project_status}`);
          if (state.project_status === 'EXECUTION_COMPLETE') {
            console.log('[Benchmark] Execution complete.');
            taskCompleted = true;
            break;
          }
          if (['HUMAN_INPUT_NEEDED', 'ERROR'].includes(state.project_status)) {
            throw new Error(`Task failed with status: ${state.project_status}`);
          }
        } else {
          console.log('[Benchmark] Polling... State file not found yet.');
        }
        await sleep(5000); // Poll every 5 seconds
      }

      if (!taskCompleted) {
        throw new Error('Benchmark timed out.');
      }

      console.log('[Benchmark] Validating solution...');
      success = await this.validateSolution(problem, tempDir);
      console.log(`[Benchmark] Validation result: ${success}`);

    } catch (err) {
      error = err.message;
      console.error(chalk.red(`[Benchmark] Error running problem ${problem.id}: ${error}`));
    } finally {
      if (engineProcess) {
        console.log(`[Benchmark] Killing engine process ${engineProcess.pid}`);
        try {
            process.kill(-engineProcess.pid);
        } catch (e) {
            console.error(`[Benchmark] Failed to kill process: ${e.message}`);
        }
      }
      if (await fs.pathExists(tempDir)) {
        console.log(`[Benchmark] Cleaning up temp directory: ${tempDir}`);
        await fs.remove(tempDir);
      }
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
      // If problem has a validation script, execute it
      if (problem.validation_script) {
        console.log(chalk.blue(`Running validation script: ${problem.validation_script}`));
        
        const validationScriptPath = path.join(__dirname, '../validators', problem.validation_script);
        const solutionScriptPath = path.join(solutionDir, problem.validation_script);
        
        // Copy validation script to solution directory
        await fs.copy(validationScriptPath, solutionScriptPath);
        
        // Create temp_solution directory for validation
        const tempSolutionDir = path.join(solutionDir, 'temp_solution');
        await fs.ensureDir(tempSolutionDir);
        
        // Copy expected files to temp_solution directory
        for (const expectedFile of problem.expected_files) {
          const sourcePath = path.join(solutionDir, expectedFile);
          const destPath = path.join(tempSolutionDir, expectedFile);
          
          // Ensure destination directory exists
          await fs.ensureDir(path.dirname(destPath));
          
          if (await fs.pathExists(sourcePath)) {
            await fs.copy(sourcePath, destPath);
          } else {
            console.error(chalk.red(`Missing expected file: ${expectedFile}`));
            return false;
          }
        }
        
        // Execute validation script
        try {
          const { stdout, stderr } = await execPromise(`node ${solutionScriptPath}`, {
            cwd: solutionDir,
            timeout: 30000
          });
          
          console.log(chalk.gray(`Validation output: ${stdout}`));
          if (stderr) {
            console.log(chalk.gray(`Validation stderr: ${stderr}`));
          }
          
          // Success determined by exit code (0 = success)
          return true;
        } catch (execError) {
          console.error(chalk.red(`Validation script failed: ${execError.message}`));
          if (execError.stdout) {
            console.log(chalk.gray(`Validation stdout: ${execError.stdout}`));
          }
          if (execError.stderr) {
            console.log(chalk.gray(`Validation stderr: ${execError.stderr}`));
          }
          return false;
        }
      }
      
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