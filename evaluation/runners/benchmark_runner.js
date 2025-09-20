import fs from 'fs-extra';
import path from 'path';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';
import os from 'os';

const execPromise = promisify(exec);
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class BenchmarkRunner {
  constructor(benchmarkFile) {
    this.benchmarkFile = benchmarkFile;
    this.results = [];
    this.diagnostics = [];
    this.performanceMetrics = {
      system: {
        platform: os.platform(),
        arch: os.arch(),
        totalmem: os.totalmem(),
        freemem: os.freemem(),
        cpus: os.cpus().length,
        loadavg: os.loadavg()
      },
      startTime: Date.now()
    };
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
    let diagnostics = {
      engineLogs: [],
      stateTransitions: [],
      agentDecisions: [],
      toolExecutions: [],
      performanceMetrics: {
        startTime: startTime,
        startMemory: process.memoryUsage(),
        startCpu: os.cpus(),
        startLoadAvg: os.loadavg()
      }
    };
    
    const tempDir = path.join(problemDir, `temp_${problem.id}`);
    let engineProcess;

    try {
      console.log(`[Benchmark] Creating temp directory: ${tempDir}`);
      await fs.ensureDir(tempDir);
      
      // Verify the directory was created
      const dirExists = await fs.pathExists(tempDir);
      console.log(`[Benchmark] Directory exists: ${dirExists}`);
      
      if (!dirExists) {
        throw new Error(`Failed to create temp directory: ${tempDir}`);
      }

      console.log('[Benchmark] Initializing Stigmergy...');
      try {
        // First, initialize npm in the temp directory
        console.log('[Benchmark] Initializing npm...');
        await new Promise((resolve, reject) => {
          const npmInit = spawn('npm', ['init', '-y'], { 
            cwd: tempDir,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          npmInit.stdout.on('data', (data) => {
            console.log(`[npm init STDOUT]: ${data}`);
          });
          
          npmInit.stderr.on('data', (data) => {
            console.error(`[npm init STDERR]: ${data}`);
          });
          
          npmInit.on('close', (code) => {
            if (code === 0) {
              console.log('[Benchmark] npm initialized.');
              resolve();
            } else {
              console.warn(chalk.yellow(`[Benchmark] npm init failed with code ${code}, continuing anyway.`));
              resolve(); // Continue even if npm init fails
            }
          });
          
          npmInit.on('error', (err) => {
            console.warn(chalk.yellow(`[Benchmark] npm init process error: ${err.message}, continuing anyway.`));
            resolve(); // Continue even if npm init fails
          });
        });
        
        // Create a simple package.json that references the stigmergy package
        const packageJsonPath = path.join(tempDir, 'package.json');
        const packageJson = {
          "name": "stigmergy-benchmark-temp",
          "version": "1.0.0",
          "description": "Temporary package for Stigmergy benchmark",
          "main": "index.js",
          "type": "module",
          "scripts": {
            "test": "echo \"Error: no test specified\" && exit 1"
          },
          "keywords": [],
          "author": "",
          "license": "ISC",
          "devDependencies": {
            "stigmergy": "file:../.."
          }
        };
        await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
        
        // Then, install dependencies
        console.log('[Benchmark] Installing dependencies...');
        await new Promise((resolve, reject) => {
          const npmInstall = spawn('npm', ['install'], { 
            cwd: tempDir,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          npmInstall.stdout.on('data', (data) => {
            console.log(`[npm install STDOUT]: ${data}`);
          });
          
          npmInstall.stderr.on('data', (data) => {
            console.error(`[npm install STDERR]: ${data}`);
          });
          
          npmInstall.on('close', (code) => {
            if (code === 0) {
              console.log('[Benchmark] Dependencies installed.');
              resolve();
            } else {
              console.warn(chalk.yellow(`[Benchmark] npm install failed with code ${code}, continuing anyway.`));
              resolve(); // Continue even if npm install fails
            }
          });
          
          npmInstall.on('error', (err) => {
            console.warn(chalk.yellow(`[Benchmark] npm install process error: ${err.message}, continuing anyway.`));
            resolve(); // Continue even if npm install fails
          });
        });
        
        // Finally, use spawn with stdin input to handle the interactive prompt
        const initProcess = spawn('npx', ['stigmergy', 'init'], { 
          cwd: tempDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });
        
        // Provide "no" as input to the interactive prompt
        initProcess.stdin.write('n\n');
        initProcess.stdin.end();
        
        // Capture output
        let stdout = '';
        let stderr = '';
        
        initProcess.stdout.on('data', (data) => {
          stdout += data.toString();
          console.log(`[stigmergy init STDOUT]: ${data}`);
        });
        
        initProcess.stderr.on('data', (data) => {
          stderr += data.toString();
          console.error(`[stigmergy init STDERR]: ${data}`);
        });
        
        // Wait for the process to complete
        await new Promise((resolve, reject) => {
          initProcess.on('close', (code) => {
            if (code === 0) {
              console.log('[Benchmark] Stigmergy initialized.');
              resolve();
            } else {
              console.warn(chalk.yellow(`[Benchmark] Stigmergy init failed with code ${code}, continuing anyway. Stdout: ${stdout}. Stderr: ${stderr}`));
              resolve(); // Continue even if stigmergy init fails
            }
          });
          
          initProcess.on('error', (err) => {
            console.warn(chalk.yellow(`[Benchmark] Stigmergy init process error: ${err.message}, continuing anyway. Stdout: ${stdout}. Stderr: ${stderr}`));
            resolve(); // Continue even if stigmergy init fails
          });
        });
      } catch (initError) {
        console.warn(chalk.yellow(`[Benchmark] Failed to initialize Stigmergy: ${initError.message}, continuing anyway.`));
        // Continue even if initialization fails
      }
      
      // Create a minimal .env file to allow the engine to start without real API keys
      const envPath = path.join(tempDir, '.stigmergy', '.env');
      const envContent = `OPENROUTER_API_KEY=dummy_key_for_benchmarking
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=password`;
      await fs.writeFile(envPath, envContent);
      console.log('[Benchmark] Created minimal environment configuration.');

      const enginePath = path.join(process.cwd(), 'engine', 'server.js');
      console.log(`[Benchmark] Spawning engine process: ${enginePath}`);
      
      // Find an available port
      const availablePort = await this.findAvailablePort();
      console.log(`[Benchmark] Using available port: ${availablePort}`);
      
      engineProcess = spawn('node', [enginePath], { 
        cwd: tempDir, 
        detached: true,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          OPENROUTER_API_KEY: 'dummy_key_for_benchmarking',
          OPENROUTER_BASE_URL: 'https://openrouter.ai/api/v1',
          NEO4J_URI: 'bolt://localhost:7687',
          NEO4J_USER: 'neo4j',
          NEO4J_PASSWORD: 'password',
          PORT: availablePort.toString(), // Set the port as an environment variable
          SOLUTION_DIR: tempDir, // Set the solution directory for benchmark validation
          PROJECT_GOAL: problem.description // Pass the problem description as the project goal
        }
      });

      // Capture engine logs
      let serverStarted = false;
      engineProcess.stdout.on('data', (data) => {
        const logData = data.toString();
        diagnostics.engineLogs.push(logData);
        console.log(chalk.gray(`[Engine STDOUT]: ${logData}`));
        
        // Check if the server has started
        if (logData.includes('Stigmergy Engine API server is running')) {
          serverStarted = true;
          console.log('[Benchmark] Engine server started successfully.');
        }
      });
      
      engineProcess.stderr.on('data', (data) => {
        const logData = data.toString();
        diagnostics.engineLogs.push(logData);
        console.error(chalk.red(`[Engine STDERR]: ${logData}`));
      });
      
      console.log('[Benchmark] Waiting for engine to start...');
      
      // Wait for the engine to start, but with a timeout
      const startTimeWait = Date.now();
      const maxWaitTime = 30000; // 30 seconds
      let enginePort = 3010; // Default port
      
      while (Date.now() - startTimeWait < maxWaitTime) {
        if (serverStarted) {
          // Check if we can extract the port from the logs
          for (const log of diagnostics.engineLogs) {
            const portMatch = log.match(/Stigmergy Engine API server is running on http:\/\/localhost:(\d+)/);
            if (portMatch) {
              enginePort = parseInt(portMatch[1]);
              console.log(`[Benchmark] Detected engine port: ${enginePort}`);
              break;
            }
          }
          break;
        }
        await sleep(1000);
      }
      
      if (!serverStarted) {
        console.warn(chalk.yellow('[Benchmark] Engine may not have started completely. Proceeding anyway.'));
      } else {
        console.log('[Benchmark] Engine should be started. Sending request.');
      }

      const chatRequest = {
        agentId: 'system',
        prompt: problem.description
      };

      // Try to send the request with retries
      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await fetch(`http://localhost:${enginePort}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(chatRequest),
          });
          break;
        } catch (fetchError) {
          retries--;
          if (retries === 0) {
            throw fetchError;
          }
          console.log(`[Benchmark] Fetch failed, retrying... (${retries} retries left)`);
          await sleep(2000);
        }
      }
      
      console.log(`[Benchmark] Initial request sent. Status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      output = JSON.stringify(await response.json(), null, 2);

      // Monitor for completion
      console.log('[Benchmark] Starting to monitor for completion...');
      const stateFilePath = path.join(tempDir, '.stigmergy', 'state', 'current.json');
      console.log(`[Benchmark] State file path: ${stateFilePath}`);
      let taskCompleted = false;
      const timeout = Date.now() + (this.benchmark.execution.timeout || 300000); // Default 5 minutes

      while (Date.now() < timeout) {
        // Capture performance metrics periodically
        if (diagnostics.stateTransitions.length % 10 === 0) { // Every 10 state checks
          diagnostics.performanceMetrics[`check_${diagnostics.stateTransitions.length}`] = {
            timestamp: Date.now(),
            memory: process.memoryUsage(),
            loadavg: os.loadavg()
          };
        }
        
        if (await fs.pathExists(stateFilePath)) {
          const state = await fs.readJson(stateFilePath);
          console.log(`[Benchmark] Polling... Current status: ${state.project_status}`);
          
          // Track state transitions for diagnostics
          diagnostics.stateTransitions.push({
            timestamp: new Date().toISOString(),
            status: state.project_status,
            message: state.message || ''
          });
          
          if (state.project_status === 'EXECUTION_COMPLETE' || state.project_status === 'COMPLETED') {
            console.log('[Benchmark] Execution complete.');
            taskCompleted = true;
            break;
          }
          
          if (['HUMAN_INPUT_NEEDED', 'ERROR'].includes(state.project_status)) {
            throw new Error(`Task failed with status: ${state.project_status}`);
          }
        } else {
          console.log('[Benchmark] Polling... State file not found yet.');
          // Check if the directory exists
          const stateDir = path.join(tempDir, '.stigmergy', 'state');
          if (await fs.pathExists(stateDir)) {
            console.log(`[Benchmark] State directory exists: ${stateDir}`);
            const files = await fs.readdir(stateDir);
            console.log(`[Benchmark] Files in state directory: ${files.join(', ')}`);
          } else {
            console.log(`[Benchmark] State directory does not exist: ${stateDir}`);
          }
        }
        await sleep(5000); // Poll every 5 seconds
      }

      if (!taskCompleted) {
        throw new Error('Benchmark timed out.');
      }

      console.log('[Benchmark] Validating solution...');
      success = await this.validateSolution(problem, tempDir, diagnostics);
      console.log(`[Benchmark] Validation result: ${success}`);

    } catch (err) {
      error = err.message;
      console.error(chalk.red(`[Benchmark] Error running problem ${problem.id}: ${error}`));
      
      // Add error to diagnostics
      diagnostics.error = error;
      diagnostics.stackTrace = err.stack;
    } finally {
      // Capture final performance metrics
      diagnostics.performanceMetrics.endTime = Date.now();
      diagnostics.performanceMetrics.endMemory = process.memoryUsage();
      diagnostics.performanceMetrics.endLoadAvg = os.loadavg();
      
      // Calculate performance differences
      diagnostics.performanceMetrics.duration = diagnostics.performanceMetrics.endTime - diagnostics.performanceMetrics.startTime;
      diagnostics.performanceMetrics.memoryDiff = {
        rss: diagnostics.performanceMetrics.endMemory.rss - diagnostics.performanceMetrics.startMemory.rss,
        heapTotal: diagnostics.performanceMetrics.endMemory.heapTotal - diagnostics.performanceMetrics.startMemory.heapTotal,
        heapUsed: diagnostics.performanceMetrics.endMemory.heapUsed - diagnostics.performanceMetrics.startMemory.heapUsed,
        external: diagnostics.performanceMetrics.endMemory.external - diagnostics.performanceMetrics.startMemory.external
      };
      
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
      output,
      diagnostics
    };
    
    this.results.push(result);
    return result;
  }

  async validateSolution(problem, solutionDir, diagnostics) {
    console.log(chalk.yellow(`Validating solution for: ${problem.title}`));
    
    try {
      // If problem has a validation script, execute it
      if (problem.validation_script) {
        console.log(chalk.blue(`Running validation script: ${problem.validation_script}`));
        
        // Use import.meta.url to get the directory instead of __dirname
        const currentDir = path.dirname(new URL(import.meta.url).pathname);
        const validationScriptPath = path.join(currentDir, '../validators', problem.validation_script);
        
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
        
        // Execute validation script directly using node
        try {
          const { exec } = await import('child_process');
          const { promisify } = await import('util');
          const execPromise = promisify(exec);
          
          // Create a package.json file to enable ES modules support
          const packageJsonPath = path.join(tempSolutionDir, 'package.json');
          const packageJson = {
            "type": "commonjs"
          };
          await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
          
          // Also create a package.json in the solution directory if it doesn't exist
          const solutionPackageJsonPath = path.join(solutionDir, 'package.json');
          if (!(await fs.pathExists(solutionPackageJsonPath))) {
            const solutionPackageJson = {
              "type": "commonjs"
            };
            await fs.writeJson(solutionPackageJsonPath, solutionPackageJson, { spaces: 2 });
          }
          
          // Use node with explicit ES module support and capture full error output
          const command = `node --experimental-specifier-resolution=node ${validationScriptPath} "${tempSolutionDir}"`;
          console.log(`[Benchmark] Executing validation command: ${command}`);
          
          // Execute with more detailed error handling
          const result = await execPromise(command, { cwd: solutionDir, maxBuffer: 1024 * 1024 * 10 });
          
          const { stdout, stderr } = result;
          
          if (stderr) {
            console.error(chalk.red(`Validation script stderr: ${stderr}`));
          }
          
          console.log(chalk.gray(`Validation output: ${stdout}`));
          
          // Parse the JSON result from stdout
          const validationResult = JSON.parse(stdout);
          
          // Add validation output to diagnostics
          if (diagnostics) {
            diagnostics.validationResult = validationResult;
          }
          
          return validationResult.success;
        } catch (execError) {
          console.error(chalk.red(`Validation script failed: ${execError.message}`));
          if (execError.stack) {
            console.error(chalk.red(`Stack trace: ${execError.stack}`));
          }
          
          // Try to get more detailed error information
          try {
            const errorOutput = execError.stderr || execError.stdout || '';
            if (errorOutput) {
              console.error(chalk.red(`Detailed error output: ${errorOutput}`));
            }
          } catch (e) {
            console.error(chalk.red(`Failed to get detailed error output: ${e.message}`));
          }
          
          // Add validation error to diagnostics
          if (diagnostics) {
            diagnostics.validationError = {
              message: execError.message,
              stack: execError.stack,
              stderr: execError.stderr,
              stdout: execError.stdout
            };
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
    
    // Capture initial system metrics
    this.performanceMetrics.startRunTime = Date.now();
    
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
          output: '',
          diagnostics: {
            error: error.message,
            stackTrace: error.stack
          }
        });
      }
    }
    
    // Capture final system metrics
    this.performanceMetrics.endRunTime = Date.now();
    this.performanceMetrics.totalRunTime = this.performanceMetrics.endRunTime - this.performanceMetrics.startRunTime;
    
    this.printSummary();
    this.printPerformanceReport();
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

  printPerformanceReport() {
    console.log('\n' + chalk.blue.bold('=== PERFORMANCE REPORT ==='));
    
    // System information
    console.log(chalk.blue('System Information:'));
    console.log(chalk.gray(`  Platform: ${this.performanceMetrics.system.platform} ${this.performanceMetrics.system.arch}`));
    console.log(chalk.gray(`  CPUs: ${this.performanceMetrics.system.cpus}`));
    console.log(chalk.gray(`  Total Memory: ${(this.performanceMetrics.system.totalmem / (1024 * 1024 * 1024)).toFixed(2)} GB`));
    
    // Run time information
    console.log(chalk.blue('Run Information:'));
    console.log(chalk.gray(`  Total Run Time: ${this.performanceMetrics.totalRunTime}ms`));
    
    // Per-problem performance
    console.log(chalk.blue('Per-Problem Performance:'));
    for (const result of this.results) {
      console.log(chalk.gray(`  ${result.title}:`));
      console.log(chalk.gray(`    Duration: ${result.duration}ms`));
      if (result.diagnostics && result.diagnostics.performanceMetrics) {
        const metrics = result.diagnostics.performanceMetrics;
        console.log(chalk.gray(`    Memory Usage: ${(metrics.memoryDiff.heapUsed / (1024 * 1024)).toFixed(2)} MB`));
      }
    }
    
    console.log(chalk.blue.bold('========================='));
  }

  async saveResults(outputFile) {
    const resultsData = {
      benchmark: this.benchmark.name,
      version: this.benchmark.version,
      timestamp: new Date().toISOString(),
      systemInfo: this.performanceMetrics.system,
      runInfo: {
        startTime: this.performanceMetrics.startRunTime,
        endTime: this.performanceMetrics.endRunTime,
        totalTime: this.performanceMetrics.totalRunTime
      },
      results: this.results
    };
    
    await fs.writeJson(outputFile, resultsData, { spaces: 2 });
    console.log(chalk.green(`Results saved to: ${outputFile}`));
    
    // Also save diagnostics
    const diagnosticsFile = outputFile.replace('.json', '_diagnostics.json');
    const diagnosticsData = {
      benchmark: this.benchmark.name,
      version: this.benchmark.version,
      timestamp: new Date().toISOString(),
      systemInfo: this.performanceMetrics.system,
      diagnostics: this.results.map(r => ({
        problemId: r.problemId,
        title: r.title,
        diagnostics: r.diagnostics
      }))
    };
    
    await fs.writeJson(diagnosticsFile, diagnosticsData, { spaces: 2 });
    console.log(chalk.green(`Diagnostics saved to: ${diagnosticsFile}`));
    
    // Save performance report
    const performanceFile = outputFile.replace('.json', '_performance.json');
    const performanceData = {
      benchmark: this.benchmark.name,
      version: this.benchmark.version,
      timestamp: new Date().toISOString(),
      systemInfo: this.performanceMetrics.system,
      runInfo: {
        startTime: this.performanceMetrics.startRunTime,
        endTime: this.performanceMetrics.endRunTime,
        totalTime: this.performanceMetrics.totalRunTime
      },
      problemPerformance: this.results.map(r => ({
        problemId: r.problemId,
        title: r.title,
        duration: r.duration,
        memoryUsage: r.diagnostics && r.diagnostics.performanceMetrics ? 
          (r.diagnostics.performanceMetrics.memoryDiff.heapUsed / (1024 * 1024)).toFixed(2) + ' MB' : 'N/A'
      }))
    };
    
    await fs.writeJson(performanceFile, performanceData, { spaces: 2 });
    console.log(chalk.green(`Performance report saved to: ${performanceFile}`));
  }

  // Helper function to find an available port
  async findAvailablePort() {
    const net = await import('net');
    return new Promise((resolve) => {
      const server = net.default.createServer();
      server.listen(0, () => {
        const port = server.address().port;
        server.close(() => {
          resolve(port);
        });
      });
    });
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