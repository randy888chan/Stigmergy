import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execPromise = promisify(exec);
const SANDBOX_DIR = path.join(os.tmpdir(), 'stigmergy-power-mode-test');
const CLI_PATH = path.resolve(process.cwd(), 'cli/index.js');

describe('E2E: Power Mode & Startup Logic', () => {
    let serverProcess;

    beforeAll(async () => {
        await fs.remove(SANDBOX_DIR);
        await fs.ensureDir(SANDBOX_DIR);
        await execPromise(`node ${CLI_PATH} install`, { cwd: SANDBOX_DIR });
    }, 45000);

    afterEach(async () => {
        if (serverProcess && !serverProcess.killed) {
            serverProcess.kill();
        }
    });

    afterAll(async () => {
        await fs.remove(SANDBOX_DIR);
    });

    test('Lightweight Mode: should start with a warning if Archon is down', async () => {
        const { stdout } = await execPromise(`node ${CLI_PATH} start`, { cwd: SANDBOX_DIR, env: { ...process.env, NODE_ENV: 'test' } });

        expect(stdout).toContain('Booting Stigmergy Engine...');
        expect(stdout).toContain('[!] Archon Power Mode: Archon server not found at localhost:8181. (Will use standard research tools).');
    }, 40000);

    test('Power Mode: should FAIL to start if Archon is down', async () => {
        let error;
        try {
            await execPromise(`node ${CLI_PATH} start --power`, { cwd: SANDBOX_DIR, env: { ...process.env, NODE_ENV: 'test' } });
        } catch (e) {
            error = e;
        }

        expect(error).toBeDefined();
        expect(error.stdout).toContain('POWER MODE ENGAGED');
        expect(error.stdout).toContain('[✖] Archon Power Mode: Archon server not found at localhost:8181. (Required in Power Mode).');
        expect(error.stderr).toContain('Engine initialization failed. Aborting startup.');
    }, 40000);

    test('Power Mode: should start successfully if Archon is connected', async () => {
        // This test can't be run in this environment because it requires a running Archon server.
        // We are just testing the failure cases here.
    }, 40000);
});
