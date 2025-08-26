import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);
const SANDBOX_DIR = path.join(os.tmpdir(), 'stigmergy-sandbox-test');
const CLI_PATH = path.resolve(process.cwd(), 'cli/index.js');
const ENGINE_PATH = path.resolve(process.cwd(), 'engine/server.js');

// Utility to wait for the server to start
const waitForServer = (childProcess, timeout = 15000) => {
  return new Promise((resolve, reject) => {
    let output = '';
    const timer = setTimeout(() => {
      childProcess.kill();
      reject(new Error(`Server failed to start within ${timeout}ms. Output: ${output}`));
    }, timeout);

    childProcess.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Stigmergy Engine server running')) {
        clearTimeout(timer);
        resolve(childProcess);
      }
    });

    childProcess.stderr.on('data', (data) => {
      output += data.toString();
    });

    childProcess.on('exit', (code) => {
      if (code !== 0 && !output.includes('Stigmergy Engine server running')) {
          clearTimeout(timer);
          reject(new Error(`Server process exited with code ${code}. Output: ${output}`));
      }
    });
  });
};


describe('E2E: Secure Sandbox Test', () => {
  let serverProcess;

  beforeAll(async () => {
    // Ensure the sandbox directory is clean before we start
    await fs.remove(SANDBOX_DIR);
    await fs.ensureDir(SANDBOX_DIR);
  }, 30000); // 30s timeout for setup

  afterAll(async () => {
    // Kill server process if it's running
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
    // Clean up the sandbox directory
    await fs.remove(SANDBOX_DIR);
  }, 30000); // 30s timeout for cleanup

  test('should install .stigmergy-core in a separate directory', async () => {
    const { stdout, stderr } = await execPromise(`node ${CLI_PATH} install`, { cwd: SANDBOX_DIR });

    console.log('Install stdout:', stdout);
    console.log('Install stderr:', stderr);

    expect(stderr).toBe('');
    expect(stdout).toContain('Setup complete. Your IDE is now configured.');

    const corePath = path.join(SANDBOX_DIR, '.stigmergy-core');
    const exists = await fs.pathExists(corePath);
    expect(exists).toBe(true);

    const goalFile = path.join(corePath, 'system_docs', '00_System_Goal.md');
    const goalExists = await fs.pathExists(goalFile);
    expect(goalExists).toBe(true);
  }, 60000); // 60s timeout for install

  test('should start the engine server successfully after installation', async () => {
    // First, ensure installation has happened
    const corePath = path.join(SANDBOX_DIR, '.stigmergy-core');
    if (!await fs.pathExists(corePath)) {
        await execPromise(`node ${CLI_PATH} install`, { cwd: SANDBOX_DIR });
    }

    const TEST_PORT = Math.floor(Math.random() * 10000) + 40000; // Random port
    serverProcess = exec(`node ${ENGINE_PATH}`, { cwd: SANDBOX_DIR, env: { ...process.env, PORT: TEST_PORT } });

    await waitForServer(serverProcess);

    // If we get here, the server started successfully.
    // The promise would have rejected otherwise.
    expect(serverProcess.killed).toBe(false);

  }, 30000); // 30s timeout for server start
});
