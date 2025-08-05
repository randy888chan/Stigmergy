import semver from 'semver';
import checkDiskSpace from 'check-disk-space';
import fs from 'fs';
import { exec } from 'child_process';
import net from 'net';

const CHECKS = [
  {name: 'Node.js', cmd: 'node -v', validate: v => semver.satisfies(v, '>=20.0.0')},
  {name: 'Disk Space', check: async () => (await checkDiskSpace('/')).free > 500e6},
  {name: 'Write Permissions', check: async (path = process.cwd()) => fs.promises.access(path, fs.constants.W_OK)},
  {name: 'Ports Available', ports: [3000, 7687]}
];

async function performCheck(check) {
    if (check.cmd) {
        return new Promise((resolve) => {
            exec(check.cmd, (error, stdout, stderr) => {
                if (error) {
                    resolve({ valid: false, error: stderr });
                    return;
                }
                const valid = check.validate(stdout.trim());
                resolve({ valid, details: stdout.trim() });
            });
        });
    }
    if (check.check) {
        try {
            await check.check();
            return { valid: true };
        } catch (error) {
            return { valid: false, error: error.message };
        }
    }
    if (check.ports) {
        const results = await Promise.all(check.ports.map(port => {
            return new Promise(resolve => {
                const server = net.createServer();
                server.listen(port, () => {
                    server.close(() => resolve({ port, available: true }));
                });
                server.on('error', () => {
                    resolve({ port, available: false });
                });
            });
        }));
        const unavailablePorts = results.filter(r => !r.available).map(r => r.port);
        if (unavailablePorts.length > 0) {
            return { valid: false, error: `Ports ${unavailablePorts.join(', ')} are not available.` };
        }
        return { valid: true };
    }
    return { valid: false, error: 'Unknown check type' };
}

export async function runPreChecks() {
  const results = {};
  for (const check of CHECS) {
    try {
      results[check.name] = await performCheck(check);
    } catch (error) {
      results[check.name] = {valid: false, error: error.message};
    }
  }
  return results;
}
