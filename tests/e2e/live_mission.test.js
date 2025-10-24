import { spawn } from 'child_process';
import { expect, test, afterAll, beforeAll } from 'bun:test';
import fs from 'fs/promises';
import path from 'path';

const ENGINE_PORT = 3012; // Use a different port for the test
const PROJECT_DIR = path.resolve(process.cwd(), 'temp-e2e-project');
const OUTPUT_FILE = path.join(PROJECT_DIR, 'output.js');
let engineProcess;
let cliProcess;

const cleanup = async () => {
  if (cliProcess && !cliProcess.killed) {
    cliProcess.kill('SIGINT');
  }
  if (engineProcess && !engineProcess.killed) {
    engineProcess.kill('SIGINT');
  }
  try {
    // Adding a small delay to allow processes to terminate gracefully
    await new Promise(resolve => setTimeout(resolve, 500));
    // Check if the directory exists before attempting to remove it
    await fs.access(PROJECT_DIR);
    await fs.rm(PROJECT_DIR, { recursive: true, force: true });
  } catch (error) {
    // If the directory doesn't exist, we can ignore the error
    if (error.code !== 'ENOENT') {
      console.error('Error during cleanup:', error);
    }
  }
};

beforeAll(async () => {
  await cleanup(); // Ensure a clean state before starting
  await fs.mkdir(PROJECT_DIR, { recursive: true });
});

afterAll(async () => {
  await cleanup();
});

test.if(process.env.OPENROUTER_API_KEY)('Live E2E Mission: Create a file', async (done) => {
  // 1. Start the Stigmergy Core Engine
  engineProcess = spawn('bun', ['run', 'engine/server.js'], {
    env: { ...process.env, STIGMERGY_PORT: ENGINE_PORT, USE_MOCK_AI: 'false' }, // Use real AI
    detached: true, // Allows killing the process group
  });

  let engineReady = false;
  engineProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log(`Engine STDOUT: ${output}`);
    if (output.includes('Stigmergy engine is running')) {
      if (!engineReady) {
        engineReady = true;
        // 2. Run the stigmergy CLI command
        runCliTest();
      }
    }
  });

  engineProcess.stderr.on('data', (data) => {
    console.error(`Engine STDERR: ${data.toString()}`);
  });

  engineProcess.on('exit', (code) => {
    console.log(`Engine process exited with code ${code}`);
  });

  const runCliTest = () => {
    const goal = "Create a file named output.js that logs 'Hello World'";
    cliProcess = spawn('bun', ['run', 'cli/index.js', 'run', '--goal', goal, '--project-path', PROJECT_DIR], {
      env: { ...process.env, STIGMERGY_PORT: ENGINE_PORT },
    });

    let cliOutput = '';
    cliProcess.stdout.on('data', (data) => {
      const output = data.toString();
      cliOutput += output;
      console.log(`CLI STDOUT: ${output}`);
    });

    cliProcess.stderr.on('data', (data) => {
      console.error(`CLI STDERR: ${data.toString()}`);
    });

    cliProcess.on('close', async (code) => {
      console.log(`CLI process exited with code ${code}`);
      expect(code).toBe(0); // Expect a successful exit code

      // 4. Verify the file was created with the correct content
      try {
        const fileContent = await fs.readFile(OUTPUT_FILE, 'utf-8');
        expect(fileContent.trim()).toBe("console.log('Hello World');");
      } catch (error) {
        // Fail the test if the file doesn't exist
        done.fail('Output file was not created or could not be read.');
        return;
      }

      // 5. Clean up and finish the test
      done();
    });
  };

  // Set a generous timeout for this E2E test
}, 300000); // 5 minutes
