import { spawn } from 'child_process';
import { Engine } from '../engine/server.js';

async function main() {
  const engine = new Engine();
  const serverProcess = spawn('bun', ['start'], { detached: true });

  serverProcess.stdout.on('data', (data) => {
    console.log(`server: ${data}`);
    if (data.toString().includes('Stigmergy Engine (Bun/Hono) server is running')) {
      const testProcess = spawn('bun', ['test', 'tests/e2e/full_workflow.test.js'], { stdio: 'inherit' });

      testProcess.on('close', (code) => {
        console.log(`Test process exited with code ${code}`);
        process.kill(-serverProcess.pid);
        process.exit(code);
      });
    }
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`server error: ${data}`);
  });
}

main();