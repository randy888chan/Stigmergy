import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import EventEmitter from 'events';

const execPromise = promisify(exec);

/**
 * Process Manager Service
 * Manages running processes, monitors their status, and provides control capabilities
 */
class ProcessManager extends EventEmitter {
  constructor() {
    super();
    this.processes = new Map(); // Map of running processes
    this.nextId = 1; // Process ID counter
  }

  /**
   * Start a new process
   * @param {string} command - Command to execute
   * @param {Object} options - Process options (cwd, env, etc.)
   * @returns {Object} Process information
   */
  startProcess(command, options = {}) {
    const processId = this.nextId++;
    const startTime = new Date();
    
    // Parse command into executable and arguments
    const parts = command.trim().split(' ');
    const executable = parts[0];
    const args = parts.slice(1);
    
    // Spawn the process
    const childProcess = spawn(executable, args, {
      cwd: options.cwd || process.cwd(),
      env: options.env || process.env,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Store process information
    const processInfo = {
      id: processId,
      command,
      executable,
      args,
      pid: childProcess.pid,
      startTime,
      status: 'running',
      stdout: '',
      stderr: '',
      exitCode: null
    };
    
    // Store in processes map
    this.processes.set(processId, processInfo);
    
    // Handle process events
    childProcess.stdout.on('data', (data) => {
      processInfo.stdout += data.toString();
      this.emit('stdout', { processId, data: data.toString() });
    });
    
    childProcess.stderr.on('data', (data) => {
      processInfo.stderr += data.toString();
      this.emit('stderr', { processId, data: data.toString() });
    });
    
    childProcess.on('close', (code) => {
      processInfo.status = 'finished';
      processInfo.exitCode = code;
      processInfo.endTime = new Date();
      this.emit('processFinished', { processId, exitCode: code });
    });
    
    childProcess.on('error', (error) => {
      processInfo.status = 'error';
      processInfo.error = error.message;
      this.emit('processError', { processId, error: error.message });
    });
    
    this.emit('processStarted', processInfo);
    return processInfo;
  }

  /**
   * Stop a running process
   * @param {number} processId - Process ID
   * @returns {boolean} Success status
   */
  stopProcess(processId) {
    const processInfo = this.processes.get(processId);
    if (!processInfo) {
      return false;
    }
    
    if (processInfo.status === 'running') {
      try {
        process.kill(processInfo.pid);
        processInfo.status = 'stopped';
        processInfo.endTime = new Date();
        this.emit('processStopped', { processId });
        return true;
      } catch (error) {
        this.emit('processError', { processId, error: error.message });
        return false;
      }
    }
    
    return false;
  }

  /**
   * Get information about a specific process
   * @param {number} processId - Process ID
   * @returns {Object|null} Process information or null if not found
   */
  getProcessInfo(processId) {
    return this.processes.get(processId) || null;
  }

  /**
   * Get information about all processes
   * @returns {Array} Array of process information
   */
  getAllProcesses() {
    return Array.from(this.processes.values());
  }

  /**
   * Get running processes only
   * @returns {Array} Array of running processes
   */
  getRunningProcesses() {
    return Array.from(this.processes.values()).filter(p => p.status === 'running');
  }

  /**
   * Execute a command and wait for completion
   * @param {string} command - Command to execute
   * @param {Object} options - Execution options
   * @returns {Object} Execution result
   */
  async executeCommand(command, options = {}) {
    try {
      const { stdout, stderr } = await execPromise(command, {
        cwd: options.cwd || process.cwd(),
        env: options.env || process.env,
        timeout: options.timeout || 30000 // 30 second default timeout
      });
      
      return {
        success: true,
        stdout,
        stderr,
        command
      };
    } catch (error) {
      return {
        success: false,
        stdout: error.stdout || '',
        stderr: error.stderr || error.message,
        command,
        error: error.message
      };
    }
  }

  /**
   * Clear finished processes from memory
   */
  clearFinishedProcesses() {
    for (const [processId, processInfo] of this.processes.entries()) {
      if (processInfo.status !== 'running') {
        this.processes.delete(processId);
      }
    }
  }
}

// Export singleton instance
export default new ProcessManager();