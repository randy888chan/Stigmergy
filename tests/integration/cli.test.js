// Note the imports are from "bun:test"
import { test, expect, beforeEach, mock, describe, beforeAll } from 'bun:test';
import path from 'path';

let vol;

beforeAll(async () => {
  const memfs = await import('memfs');
  vol = memfs.vol;
});

// THE BUN WAY: Mock the module and define its exports.
mock.module('fs-extra', async () => {
  const memfs = await import('memfs'); // Use ESM import for the in-memory file system
  return {
    ...memfs.fs, // Spread the entire in-memory fs library
    __esModule: true, // Mark as an ES Module
    // Explicitly add any functions that might be missing from memfs but are in fs-extra
    ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
    pathExists: (path) => Promise.resolve(memfs.fs.existsSync(path)),
    copy: (src, dest) => Promise.resolve(), // Mock copy to do nothing
    readFile: (path, encoding) => Promise.resolve(memfs.fs.readFileSync(path, encoding)),
    writeFile: (path, data, encoding) => Promise.resolve(memfs.fs.writeFileSync(path, data, encoding)),
    // Add default export for compatibility
    default: {
        ...memfs.fs,
        ensureDir: memfs.fs.mkdir.bind(null, { recursive: true }),
        pathExists: (path) => Promise.resolve(memfs.fs.existsSync(path)),
        copy: (src, dest) => Promise.resolve(), // Mock copy to do nothing
        readFile: (path, encoding) => Promise.resolve(memfs.fs.readFileSync(path, encoding)),
        writeFile: (path, data, encoding) => Promise.resolve(memfs.fs.writeFileSync(path, data, encoding)),
    }
  };
});
mock.module('inquirer', () => ({
  default: {
    prompt: () => Promise.resolve({ configureKeys: false }),
  },
  __esModule: true,
}));

// NOW, import the modules. Bun will give us the mocked versions.
import fs from 'fs-extra';
import { init } from '../../cli/commands/init.js';


describe('stigmergy init (with Bun)', () => {
  beforeEach(() => {
    vol.reset();
    // Pre-populate the project.env.example template
    const templatePath = path.resolve(import.meta.dir, '../../cli/templates/project.env.example');
    vol.fromJSON({
      [templatePath]: 'PROJECT_NAME=my-new-app'
    }, path.resolve(import.meta.dir, '../..'));
  });

  test('should create a simplified .env.stigmergy.example file', async () => {
    await init({ interactive: false });

    const envExamplePath = path.join(process.cwd(), '.stigmergy/.env.stigmergy.example');
    const envExampleContent = await fs.readFile(envExamplePath, 'utf8');

    expect(envExampleContent).toContain('PROJECT_NAME=my-new-app');
    expect(envExampleContent).not.toContain('GOOGLE_API_KEY');
  });
});