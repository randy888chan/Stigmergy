import fs from 'fs-extra';
import path from 'path';
import { install } from '../../cli/commands/install.js';

beforeEach(async () => {
  // Create clean test environment
  await fs.emptyDir('./.stigmergy-core');
  await fs.copy(path.resolve(__dirname, './fixtures/valid-manifest.md'), './.stigmergy-core/system_docs/02_Agent_Manifest.md');
});

afterAll(async () => {
  await fs.remove('./.roomodes');
});

describe('install command', () => {
  it('should create .roomodes file', async () => {
    await install();
    const roomodesPath = path.join(process.cwd(), '.roomodes');
    expect(await fs.pathExists(roomodesPath)).toBe(true);
  });
});
